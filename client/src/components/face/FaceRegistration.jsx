import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFaceDetection } from '../../hooks/useFaceDetection';
import api from '../../services/api';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { HiOutlineCamera, HiOutlineCheckCircle, HiOutlineArrowUpTray, HiOutlineExclamationTriangle, HiOutlineArrowPath } from 'react-icons/hi2';

export default function FaceRegistration({ studentId, studentName, onSuccess, onClose }) {
  const {
    modelsLoaded,
    loadingModels,
    modelError,
    detectSingleFace,
    faceapi,
  } = useFaceDetection();

  const [mode, setMode] = useState(null); // 'camera' | 'upload'
  const [step, setStep] = useState('intro'); // intro -> scanning -> uploading -> success -> error
  const [capturedCount, setCapturedCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Initializing...');
  const [descriptors, setDescriptors] = useState([]);
  
  // Camera state refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Photo upload state
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [photoSuccess, setPhotoSuccess] = useState(false);
  const photoCanvasRef = useRef(null);

  const startCamera = async () => {
    try {
      setStatusMessage('Starting webcam...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      setStatusMessage('Failed to access webcam. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  useEffect(() => {
    if (step === 'scanning' && mode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [step, mode]);

  // Camera frame processing loop
  const processFrame = useCallback(async () => {
    if (!videoRef.current || !modelsLoaded || step !== 'scanning') {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const video = videoRef.current;
    
    // Check if video is playing and has data
    if (video.paused || video.ended || video.readyState < 2) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    try {
      const detection = await detectSingleFace(video);
      
      // Draw canvas overlay
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 480;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (detection) {
          const displaySize = { width, height };
          const resizedDetection = faceapi.resizeResults(detection, displaySize);
          const { box } = resizedDetection.detection;
          ctx.strokeStyle = '#6366f1'; // Indigo color
          ctx.lineWidth = 3;
          ctx.strokeRect(box.x, box.y, box.width, box.height);
          
          setStatusMessage(`Hold still... Capturing sample ${descriptors.length + 1} of 3`);
          
          // Add descriptor
          if (detection.descriptor) {
            setDescriptors((prev) => {
              if (prev.length < 3) {
                const newDescriptors = [...prev, Array.from(detection.descriptor)];
                setCapturedCount(newDescriptors.length);
                setProgress(Math.round((newDescriptors.length / 3) * 100));
                
                if (newDescriptors.length === 3) {
                  setTimeout(() => setStep('uploading'), 1000);
                }
                return newDescriptors;
              }
              return prev;
            });
          }
        } else {
          setStatusMessage('No face detected. Align face inside frame.');
        }
      }
    } catch (err) {
      console.error('Error processing video frame:', err);
    }

    // Keep looping if we are in scanning
    if (step === 'scanning') {
      setTimeout(() => {
        animationFrameRef.current = requestAnimationFrame(processFrame);
      }, 300); // slightly throttled to save CPU cycles
    }
  }, [step, modelsLoaded, descriptors.length, detectSingleFace]);

  useEffect(() => {
    if (step === 'scanning' && mode === 'camera') {
      animationFrameRef.current = requestAnimationFrame(processFrame);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [step, mode, processFrame]);

  // Photo file picker/drop change handler
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    setPhotoSuccess(false);
    setStatusMessage('Reading photo file...');
    setProcessingPhoto(true);

    const imageUrl = URL.createObjectURL(file);
    setPhotoPreview(imageUrl);

    // Run face detection on image
    try {
      const imgElement = new Image();
      imgElement.src = imageUrl;
      imgElement.onload = async () => {
        setStatusMessage('Detecting face in photo...');
        const detection = await detectSingleFace(imgElement);

        if (detection && detection.descriptor) {
          setDescriptors([Array.from(detection.descriptor)]);
          setPhotoSuccess(true);
          setStatusMessage('Face detected successfully! Ready to register.');

          // Draw green box on photo canvas overlay
          const canvas = photoCanvasRef.current;
          if (canvas) {
            canvas.width = imgElement.naturalWidth || 640;
            canvas.height = imgElement.naturalHeight || 480;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const { box } = detection.detection;
            ctx.strokeStyle = '#10b981'; // green
            ctx.lineWidth = Math.max(4, canvas.width / 120);
            ctx.strokeRect(box.x, box.y, box.width, box.height);
          }
        } else {
          setPhotoSuccess(false);
          setStatusMessage('No face detected in photo. Please ensure a clear, well-lit, front-facing portrait.');
        }
        setProcessingPhoto(false);
      };
    } catch (err) {
      console.error(err);
      setPhotoSuccess(false);
      setStatusMessage('Error processing image.');
      setProcessingPhoto(false);
    }
  };

  // Upload descriptors to the backend
  useEffect(() => {
    if (step === 'uploading') {
      const uploadFaceData = async () => {
        try {
          setStatusMessage('Uploading face descriptors...');
          
          if (photoFile) {
            const formData = new FormData();
            formData.append('descriptors', JSON.stringify(descriptors));
            formData.append('photos', photoFile);
            
            await api.post(`/face/register/${studentId}`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
          } else {
            await api.post(`/face/register/${studentId}`, {
              descriptors: descriptors,
            });
          }
          
          setStep('success');
          if (onSuccess) onSuccess();
        } catch (err) {
          console.error(err);
          setStatusMessage(err.response?.data?.message || 'Failed to save face descriptors.');
          setStep('error');
        }
      };
      uploadFaceData();
    }
  }, [step, descriptors, studentId, photoFile, onSuccess]);

  // Reset helper
  const resetRegistration = () => {
    setDescriptors([]);
    setCapturedCount(0);
    setProgress(0);
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoSuccess(false);
    setMode(null);
    setStep('intro');
  };

  return (
    <div className="flex flex-col items-center justify-center p-2 text-gray-800 dark:text-gray-200 w-full">
      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center space-y-6 w-full max-w-md"
          >
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center mx-auto shadow-xl shadow-primary-500/20">
              <HiOutlineCamera className="text-4xl text-white animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Register Face for {studentName}</h3>
              <p className="text-sm text-gray-400">
                To enable local face recognition, please choose one of the options below to capture the student's face credentials.
              </p>
            </div>

            {!modelsLoaded ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                <p className="text-xs text-gray-500">
                  {loadingModels ? 'Loading face models...' : 'Waiting for models...'}
                </p>
                {modelError && <p className="text-xs text-red-400">Error: {modelError}</p>}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setMode('camera');
                    setStep('scanning');
                  }}
                  className="flex flex-col items-center p-6 rounded-2xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.05] hover:border-primary-500/50 transition-all duration-300 group"
                >
                  <HiOutlineCamera className="text-3xl text-gray-400 group-hover:text-primary-400 group-hover:scale-110 transition-transform mb-3" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Camera Scan</span>
                  <span className="text-xs text-gray-500 mt-1 text-center">Capture 3 live webcam photos</span>
                </button>

                <button
                  onClick={() => {
                    setMode('upload');
                    setStep('photo_upload');
                  }}
                  className="flex flex-col items-center p-6 rounded-2xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.05] hover:border-primary-500/50 transition-all duration-300 group"
                >
                  <HiOutlineArrowUpTray className="text-3xl text-gray-400 group-hover:text-primary-400 group-hover:scale-110 transition-transform mb-3" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Photo Upload</span>
                  <span className="text-xs text-gray-500 mt-1 text-center">Upload a face image file</span>
                </button>
              </div>
            )}
            
            <div className="flex justify-center pt-2">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
            </div>
          </motion.div>
        )}

        {step === 'scanning' && mode === 'camera' && (
          <motion.div
            key="scanner"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full flex flex-col items-center space-y-4"
          >
            <div className="text-center w-full max-w-sm">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Capturing Templates</h3>
              <p className="text-xs text-gray-400 mt-1">Keep the student's face centered inside the camera view.</p>
            </div>

            {/* Webcam Window */}
            <div className="relative rounded-2xl overflow-hidden border border-gray-300 dark:border-white/10 bg-gray-900 dark:bg-black aspect-video w-full max-w-lg shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
              <canvas
                ref={canvasRef}
                width="640"
                height="480"
                className="absolute inset-0 w-full h-full scale-x-[-1]"
              />

              {/* Progress HUD */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/80 dark:bg-black/60 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl p-3 space-y-2">
                <div className="flex justify-between text-xs text-gray-300">
                  <span>Scanning descriptors:</span>
                  <span>{capturedCount}/3 samples</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <motion.div 
                    className="bg-gradient-to-r from-primary-500 to-purple-600 h-full"
                    animate={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Status message */}
            <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl px-4 py-2 text-center max-w-sm">
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-ping" />
              <span>{statusMessage}</span>
            </div>

            <div className="flex gap-2 justify-center w-full">
              <Button variant="ghost" size="sm" onClick={resetRegistration}>
                Back
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'photo_upload' && mode === 'upload' && (
          <motion.div
            key="photo_upload"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full flex flex-col items-center space-y-5"
          >
            <div className="text-center w-full max-w-sm">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Upload Face Photo</h3>
              <p className="text-xs text-gray-400 mt-1">Upload a clear, front-facing portrait of the student.</p>
            </div>

            {/* Image Preview / Drop Zone */}
            <div className="w-full max-w-lg">
              {!photoPreview ? (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-white/10 hover:border-primary-500/50 bg-gray-50 dark:bg-white/[0.01] hover:bg-gray-100 dark:hover:bg-white/[0.03] rounded-2xl p-10 cursor-pointer transition-all duration-300 group aspect-video">
                  <HiOutlineArrowUpTray className="text-4xl text-gray-500 group-hover:text-primary-400 transition-colors mb-3" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Select Photo File</span>
                  <span className="text-xs text-gray-500 mt-1">Supports JPG, JPEG, or PNG (Max 5MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black aspect-video flex items-center justify-center">
                  <div className="relative max-w-full max-h-full flex items-center justify-center">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="max-w-full max-h-full object-contain"
                    />
                    <canvas
                      ref={photoCanvasRef}
                      className="absolute inset-0 w-full h-full pointer-events-none"
                    />
                  </div>

                  {/* Actions overlay */}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview(null);
                        setPhotoSuccess(false);
                      }}
                      className="bg-black/60 hover:bg-black/80 text-white rounded-lg p-2 transition-colors border border-white/10"
                    >
                      <HiOutlineArrowPath className="text-sm" />
                    </button>
                    {photoSuccess && (
                      <Badge color="success" variant="solid">
                        Face Verified
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Status Message */}
            {(processingPhoto || statusMessage) && (
              <div className={`flex items-center gap-2 text-sm bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl px-4 py-2 text-center max-w-md ${photoSuccess ? 'text-emerald-400 border-emerald-500/10' : 'text-gray-400'}`}>
                {processingPhoto && <span className="w-3 h-3 border-2 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />}
                <span>{statusMessage}</span>
              </div>
            )}

            <div className="flex gap-3 justify-center w-full">
              <Button variant="ghost" onClick={resetRegistration}>
                Back
              </Button>
              <Button
                onClick={() => setStep('uploading')}
                disabled={!photoSuccess || processingPhoto}
              >
                Register Face
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'uploading' && (
          <motion.div
            key="uploading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center space-y-4 max-w-xs py-8"
          >
            <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium">{statusMessage}</p>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6 max-w-sm py-4"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
              <HiOutlineCheckCircle className="text-5xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Registration Complete!</h3>
              <p className="text-sm text-gray-400">
                Face credentials for {studentName} have been securely registered and stored locally.
              </p>
            </div>
            <div className="flex justify-center">
              <Button onClick={onClose}>Done</Button>
            </div>
          </motion.div>
        )}

        {step === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6 max-w-sm py-4"
          >
            <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400">
              <HiOutlineExclamationTriangle className="text-5xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Registration Failed</h3>
              <p className="text-sm text-red-400 bg-red-500/5 border border-red-500/10 rounded-xl p-3">
                {statusMessage}
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="ghost" onClick={onClose}>Close</Button>
              <Button onClick={resetRegistration}>Try Again</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
