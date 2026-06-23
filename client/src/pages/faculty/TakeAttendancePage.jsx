import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { useFaceDetection } from '../../hooks/useFaceDetection';
import { useSocket } from '../../hooks/useSocket';
import { HiOutlineCamera, HiOutlineStopCircle, HiOutlineCheckCircle, HiOutlineClock, HiOutlineUserGroup } from 'react-icons/hi2';
import { formatTime } from '../../utils/helpers';
import { FACE_MATCH_THRESHOLD } from '../../utils/constants';

// Helper to average multiple 128D descriptors and return a single L2-normalized centroid descriptor array
const getCentroidDescriptor = (descriptors) => {
  if (!descriptors || descriptors.length === 0) return [];
  if (descriptors.length === 1) return descriptors;

  const avg = new Float32Array(128);
  for (let i = 0; i < 128; i++) {
    let sum = 0;
    for (let j = 0; j < descriptors.length; j++) {
      sum += descriptors[j][i];
    }
    avg[i] = sum / descriptors.length;
  }

  // L2-normalize the centroid
  let sumSq = 0;
  for (let i = 0; i < 128; i++) sumSq += avg[i] * avg[i];
  const norm = Math.sqrt(sumSq);
  if (norm > 0) {
    for (let i = 0; i < 128; i++) avg[i] /= norm;
  }
  return [avg];
};

export default function TakeAttendancePage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { modelsLoaded, loadingModels, detectFaces, matchFace, faceapi } = useFaceDetection();

  const [step, setStep] = useState(1); // 1: Select, 2: Camera, 3: Summary
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [config, setConfig] = useState({ department: '', semester: '', subject: '', section: 'A' });

  const availableSemesters = React.useMemo(() => {
    if (user && user.role === 'faculty' && user.profile?.subjects) {
      const sems = (user.profile.subjects || [])
        .map(s => s.semester)
        .filter(sem => sem != null);
      if (sems.length > 0) {
        return Array.from(new Set(sems)).sort((a, b) => a - b);
      }
    }
    return [1, 2, 3, 4, 5, 6, 7, 8];
  }, [user]);

  useEffect(() => {
    if (availableSemesters.length === 1) {
      setConfig(prev => ({ ...prev, semester: String(availableSemesters[0]) }));
    }
  }, [availableSemesters]);

  const [session, setSession] = useState(null);
  const [recognizedStudents, setRecognizedStudents] = useState([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [classStudents, setClassStudents] = useState([]);
  const [selectedManualStudentId, setSelectedManualStudentId] = useState('');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Refs for tracking data inside the frame loop
  const sessionRef = useRef(null);
  const labeledDescriptorsRef = useRef([]);
  const markedIdsRef = useRef(new Set());
  const detectionVotesRef = useRef({});

  // Sync session ref
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    fetchOptions();
    checkActiveSession();
  }, []);

  const fetchOptions = async () => {
    try {
      const [d, s] = await Promise.all([api.get('/departments'), api.get('/subjects')]);
      const fetchedDepts = d.data.data || [];
      const fetchedSubs = s.data.data || [];

      if (user && user.role === 'faculty') {
        const assignedDeptIds = new Set();
        if (user.profile?.department) {
          assignedDeptIds.add(user.profile.department._id || user.profile.department);
        }
        if (user.profile?.subjects) {
          user.profile.subjects.forEach(sub => {
            if (sub.department) {
              assignedDeptIds.add(sub.department._id || sub.department);
            }
          });
        }
        const filteredDepts = fetchedDepts.filter(dept => assignedDeptIds.has(dept._id));
        setDepartments(filteredDepts);
        
        // Auto-select department if there is only 1
        if (filteredDepts.length === 1) {
          setConfig(prev => ({ ...prev, department: filteredDepts[0]._id }));
        }

        const assignedSubjectIds = new Set((user.profile?.subjects || []).map(sub => sub._id || sub));
        setSubjects(fetchedSubs.filter(sub => assignedSubjectIds.has(sub._id)));
      } else {
        setDepartments(fetchedDepts);
        setSubjects(fetchedSubs);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Socket listener for real-time marked attendance
  useEffect(() => {
    if (!socket || !session?._id) return;

    // Join the session room
    socket.emit('join:session', session._id);

    const handleAttendanceMarked = (data) => {
      if (data.sessionId === session._id) {
        const student = data.attendance?.student;
        if (student) {
          setRecognizedStudents((prev) => {
            if (prev.find((s) => s.studentId === student._id)) return prev;
            return [
              ...prev,
              {
                studentId: student._id,
                name: student.user?.name,
                rollNumber: student.rollNumber || 'N/A',
                confidence: data.attendance.faceConfidence || 1.0,
                time: new Date(data.attendance.markedAt),
              },
            ];
          });
          // Update marked set
          markedIdsRef.current.add(student._id);
        }
      }
    };

    socket.on('attendance:marked', handleAttendanceMarked);

    return () => {
      socket.emit('leave:session', session._id);
      socket.off('attendance:marked', handleAttendanceMarked);
    };
  }, [socket, session?._id]);

  const fetchClassStudents = async (deptId, sem, sec) => {
    try {
      const { data } = await api.get('/students', {
        params: {
          department: deptId,
          semester: sem,
          section: sec,
          limit: 100,
        },
      });
      setClassStudents(data.data || []);
    } catch (err) {
      console.error('Failed to fetch class students:', err);
    }
  };

  const startSession = async () => {
    try {
      // 1. Fetch class face descriptors
      const { data: faceData } = await api.get('/face/class', {
        params: {
          department: config.department,
          semester: config.semester,
          section: config.section,
        },
      });

      const classFaceList = faceData.data || [];
      if (classFaceList.length === 0) {
        alert('Warning: No students with registered face data found in this class.');
      }

      labeledDescriptorsRef.current = classFaceList.map((student) => ({
        label: `${student.studentId}|${student.name}|${student.rollNumber}`,
        descriptors: getCentroidDescriptor(student.descriptors),
      }));

      // 2. Start session on the server
      const { data } = await api.post('/sessions/start', {
        subject: config.subject,
        department: config.department,
        semester: parseInt(config.semester),
        section: config.section,
      });

      const activeSession = data.data || data.session || data;
      setSession(activeSession);
      
      // Clear previous markers
      markedIdsRef.current.clear();
      detectionVotesRef.current = {};
      setRecognizedStudents([]);

      // 3. Load pre-existing attendance records if page was refreshed
      try {
        const { data: recordsData } = await api.get(`/attendance/session/${activeSession._id}`);
        const records = recordsData.data?.attendance || [];
        records.forEach((rec) => {
          if (rec.student) {
            markedIdsRef.current.add(rec.student._id);
            setRecognizedStudents((prev) => [
              ...prev,
              {
                studentId: rec.student._id,
                name: rec.student.user?.name,
                rollNumber: rec.student.rollNumber || 'N/A',
                confidence: rec.faceConfidence || 1.0,
                time: new Date(rec.markedAt),
              },
            ]);
          }
        });
      } catch (err) {
        console.error('Failed to load session attendance records:', err);
      }

      // Fetch all students for manual fallback
      await fetchClassStudents(config.department, config.semester, config.section);

      // 4. Start camera and timer
      setStep(2);
      await startCamera();
      timerRef.current = setInterval(() => setElapsedTime((t) => t + 1), 1000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start session');
      console.error(err);
    }
  };

  const handleMarkPresent = async (studentId, confidence) => {
    try {
      if (!sessionRef.current?._id) return;
      await api.post('/attendance/mark', {
        studentId,
        sessionId: sessionRef.current._id,
        status: 'present',
        faceConfidence: confidence,
        verificationMethod: 'face',
      });
    } catch (err) {
      console.error('Failed to mark student present:', err);
    }
  };

  const handleManualMark = async () => {
    if (!selectedManualStudentId || !sessionRef.current?._id) return;
    try {
      await api.post('/attendance/mark', {
        studentId: selectedManualStudentId,
        sessionId: sessionRef.current._id,
        status: 'present',
        faceConfidence: 1.0,
        verificationMethod: 'manual',
      });
      setSelectedManualStudentId('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark student present manually');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      alert('Camera access denied. Please allow camera access.');
      console.error(err);
    }
  };

  const checkActiveSession = async () => {
    try {
      const { data: activeRes } = await api.get('/sessions/active');
      const activeSessions = activeRes.data || [];
      const mySession = activeSessions.find(
        (s) => s.faculty?.user?._id === user._id || s.faculty?.user === user._id
      );

      if (mySession) {
        setSession(mySession);
        setConfig({
          department: mySession.department?._id || mySession.department,
          semester: String(mySession.semester),
          subject: mySession.subject?._id || mySession.subject,
          section: mySession.section,
        });

        // Fetch face data for this class
        const { data: faceData } = await api.get('/face/class', {
          params: {
            department: mySession.department?._id || mySession.department,
            semester: mySession.semester,
            section: mySession.section,
          },
        });

        const classFaceList = faceData.data || [];
        labeledDescriptorsRef.current = classFaceList.map((student) => ({
          label: `${student.studentId}|${student.name}|${student.rollNumber}`,
          descriptors: getCentroidDescriptor(student.descriptors),
        }));

        // Load pre-existing records
        try {
          const { data: recordsData } = await api.get(`/attendance/session/${mySession._id}`);
          const records = recordsData.data?.attendance || [];
          markedIdsRef.current.clear();
          detectionVotesRef.current = {};
          const recognized = [];
          records.forEach((rec) => {
            if (rec.student) {
              markedIdsRef.current.add(rec.student._id);
              recognized.push({
                studentId: rec.student._id,
                name: rec.student.user?.name,
                rollNumber: rec.student.rollNumber || 'N/A',
                confidence: rec.faceConfidence || 1.0,
                time: new Date(rec.markedAt),
              });
            }
          });
          setRecognizedStudents(recognized);
        } catch (err) {
          console.error('Failed to load session attendance records:', err);
        }

        // Fetch all students for manual fallback
        await fetchClassStudents(
          mySession.department?._id || mySession.department,
          mySession.semester,
          mySession.section
        );

        // Start camera and timer
        setStep(2);
        await startCamera();
        const startTime = new Date(mySession.createdAt || mySession.date || Date.now());
        const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
        setElapsedTime(elapsed > 0 ? elapsed : 0);
        
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => setElapsedTime((t) => t + 1), 1000);
      }
    } catch (err) {
      console.error('Error checking active session:', err);
    }
  };

  // Detection loop running on video frames
  const detectionLoop = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !modelsLoaded || !cameraActive) {
      animationFrameRef.current = requestAnimationFrame(detectionLoop);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.paused || video.ended || video.readyState < 2) {
      animationFrameRef.current = requestAnimationFrame(detectionLoop);
      return;
    }

    try {
      // Run detection
      const detections = await detectFaces(video, { useTiny: false, minConfidence: 0.5 });

      if (canvas) {
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 480;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, width, height);

        const displaySize = { width, height };
        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        const currentFrameMatches = new Set();

        resizedDetections.forEach((det) => {
          const { box } = det.detection;
          const descriptor = det.descriptor;

          let labelText = 'Unknown';
          let color = '#ef4444'; // Red
          let confidence = 0;

          if (labeledDescriptorsRef.current.length > 0 && descriptor) {
            const match = matchFace(descriptor, labeledDescriptorsRef.current, FACE_MATCH_THRESHOLD);
            if (match && match.label !== 'unknown') {
              const [studentId, name, rollNumber] = match.label.split('|');
              confidence = match.confidence;
              currentFrameMatches.add(studentId);

              // Increment temporal recognition votes
              detectionVotesRef.current[studentId] = (detectionVotesRef.current[studentId] || 0) + 1;

              if (detectionVotesRef.current[studentId] >= 4) { // Requires 4 frame matches
                labelText = `${name} (${confidence}%)`;
                color = '#10b981'; // Green

                // Request to mark attendance on backend (throttled locally by Set)
                if (!markedIdsRef.current.has(studentId)) {
                  markedIdsRef.current.add(studentId);
                  handleMarkPresent(studentId, confidence / 100);
                }
              } else {
                labelText = `Scanning ${name}...`;
                color = '#f59e0b'; // Amber
              }
            }
          }

          // Draw bounding box
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.strokeRect(box.x, box.y, box.width, box.height);

          // Draw label background
          ctx.fillStyle = color;
          ctx.font = 'bold 16px sans-serif';
          const textWidth = ctx.measureText(labelText).width;
          ctx.fillRect(box.x - 1.5, box.y - 30, textWidth + 16, 30);

          // Draw text (mirrored back to normal display)
          ctx.save();
          ctx.translate(box.x + 8 + textWidth / 2, box.y - 15);
          ctx.scale(-1, 1);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(labelText, 0, 0);
          ctx.restore();
        });

        // Decay votes for students not recognized in this frame
        Object.keys(detectionVotesRef.current).forEach((studentId) => {
          if (!currentFrameMatches.has(studentId)) {
            detectionVotesRef.current[studentId] = Math.max(0, detectionVotesRef.current[studentId] - 1);
          }
        });
      }
    } catch (err) {
      console.error('Frame processing loop error:', err);
    }

    // Loop
    animationFrameRef.current = requestAnimationFrame(detectionLoop);
  }, [modelsLoaded, cameraActive, detectFaces, matchFace]);

  // Start loop when camera is active
  useEffect(() => {
    if (cameraActive && modelsLoaded) {
      animationFrameRef.current = requestAnimationFrame(detectionLoop);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [cameraActive, modelsLoaded, detectionLoop]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const endSession = async () => {
    stopCamera();
    try {
      if (session?._id) {
        await api.put(`/sessions/${session._id}/end`);
      }
    } catch (err) {
      console.error(err);
    }
    setStep(3);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const formatElapsed = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const filteredSubjects = subjects.filter(
    (s) => 
      (!config.department || s.department?._id === config.department || s.department === config.department) &&
      (!config.semester || String(s.semester) === String(config.semester))
  );

  if (step === 3) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto space-y-6">
        <div className="glass-card p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <HiOutlineCheckCircle className="text-4xl text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Session Complete!</h2>
          <p className="text-gray-500 mb-6">Attendance has been recorded successfully</p>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="glass-card p-4">
              <p className="text-2xl font-bold text-emerald-400">{recognizedStudents.length}</p>
              <p className="text-xs text-gray-500">Present</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-2xl font-bold text-red-400">0</p>
              <p className="text-xs text-gray-500">Absent</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-2xl font-bold text-primary-400">{formatElapsed(elapsedTime)}</p>
              <p className="text-xs text-gray-500">Duration</p>
            </div>
          </div>
          <Button
            onClick={() => {
              setStep(1);
              setRecognizedStudents([]);
              setElapsedTime(0);
              setSession(null);
            }}
          >
            New Session
          </Button>
        </div>
      </motion.div>
    );
  }

  if (step === 2) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        {/* Status bar */}
        <div className="glass-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-medium text-red-600 dark:text-red-400">LIVE SCAN</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <HiOutlineClock />
              <span className="font-mono text-sm">{formatElapsed(elapsedTime)}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <HiOutlineUserGroup />
              <span className="text-sm font-medium">{recognizedStudents.length} Present</span>
            </div>
            <Button variant="danger" size="sm" onClick={endSession}>
              <HiOutlineStopCircle className="mr-1" /> End Session
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Camera */}
          <div className="lg:col-span-2 glass-card p-4">
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ transform: 'scaleX(-1)' }}
              />
              {!cameraActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 dark:bg-dark/80">
                  <div className="text-center">
                    <HiOutlineCamera className="text-4xl text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Starting camera...</p>
                  </div>
                </div>
              )}
              <div className="absolute bottom-4 left-4 flex gap-2">
                <Badge color="success" variant="solid">
                  Face Detection Active
                </Badge>
              </div>
            </div>
          </div>

          {/* Recognized list */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Recognized Students ({recognizedStudents.length})</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              <AnimatePresence>
                {recognizedStudents.map((s, i) => (
                  <motion.div
                    key={s.studentId}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-xs font-bold">
                      {s.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.rollNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-emerald-400">{(s.confidence * 100).toFixed(0)}%</p>
                      <p className="text-[10px] text-gray-600">{formatTime(s.time)}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {recognizedStudents.length === 0 && (
                <div className="text-center py-8 text-gray-600">
                  <p className="text-sm">Waiting for faces...</p>
                </div>
              )}
            </div>

            {/* Manual Entry Fallback */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-white/10 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Manual Entry Fallback</h4>
              <p className="text-xs text-gray-450 dark:text-gray-400">If a student is not recognized, mark their attendance manually:</p>
              <div className="flex gap-2">
                <select
                  value={selectedManualStudentId}
                  onChange={(e) => setSelectedManualStudentId(e.target.value)}
                  className="input-field text-xs py-1.5 flex-1"
                >
                  <option value="">Select Student...</option>
                  {classStudents
                    .filter((student) => !recognizedStudents.some((rec) => rec.studentId === student._id))
                    .map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.user?.name || s.name} ({s.rollNumber || 'N/A'})
                      </option>
                    ))}
                </select>
                <Button
                  size="sm"
                  onClick={handleManualMark}
                  disabled={!selectedManualStudentId}
                >
                  Mark Present
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Step 1: Selection
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-2xl mx-auto space-y-6 transform-gpu will-change-transform"
    >
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-primary-500/20">
          <HiOutlineCamera className="text-white text-4xl" />
        </div>
        <h1 className="text-2xl font-bold">Take Attendance</h1>
        <p className="text-gray-500 text-sm mt-1">Select class details to start face recognition</p>
      </div>

      <div className="glass-card p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Department</label>
            <select
              value={config.department}
              onChange={(e) => setConfig({ ...config, department: e.target.value })}
              className="input-field"
              required
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Semester</label>
            <select
              value={config.semester}
              onChange={(e) => setConfig({ ...config, semester: e.target.value })}
              className="input-field"
              required
            >
              <option value="">Select</option>
              {availableSemesters.map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Subject</label>
            <select
              value={config.subject}
              onChange={(e) => setConfig({ ...config, subject: e.target.value })}
              className="input-field"
              required
            >
              <option value="">Select Subject</option>
              {filteredSubjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Section</label>
            <select
              value={config.section}
              onChange={(e) => setConfig({ ...config, section: e.target.value })}
              className="input-field"
            >
              {['A', 'B', 'C', 'D'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!modelsLoaded ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-2 pt-2 transform-gpu"
            >
              <div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
              <p className="text-xs text-gray-500">
                {loadingModels ? 'Loading face models...' : 'Waiting for models...'}
              </p>
            </motion.div>
          ) : (
            <motion.button
              key="start-btn"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              whileHover={{ scale: 1.015, y: -1 }}
              whileTap={{ scale: 0.985 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              onClick={startSession}
              disabled={!config.department || !config.semester || !config.subject}
              className="gradient-btn w-full py-4 text-center text-lg font-semibold disabled:opacity-30 flex items-center justify-center gap-3 transform-gpu will-change-transform"
            >
              <HiOutlineCamera className="text-xl" />
              Start Attendance Session
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
