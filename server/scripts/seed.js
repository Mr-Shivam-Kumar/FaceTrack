const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

// Import models
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const Course = require('../models/Course');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const AttendanceSession = require('../models/AttendanceSession');
const FaceEmbedding = require('../models/FaceEmbedding');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

// Realistic Indian names
const firstNames = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Advaith', 'Aarush', 'Kabir', 'Ritvik', 'Anirudh', 'Dhruv',
  'Ananya', 'Diya', 'Myra', 'Sara', 'Aanya', 'Aadhya', 'Aarohi', 'Anvi', 'Prisha', 'Riya',
  'Aisha', 'Navya', 'Avni', 'Kiara', 'Mahi', 'Ira', 'Saanvi', 'Pihu', 'Kavya', 'Ishita',
  'Rohan', 'Karan', 'Raj', 'Dev', 'Aryan', 'Varun', 'Yash', 'Nikhil', 'Rahul', 'Amit',
  'Sneha', 'Pooja', 'Neha', 'Priya', 'Shruti', 'Tanvi', 'Riddhi', 'Siddhi', 'Meera', 'Tara',
  'Harsh', 'Parth', 'Mihir', 'Chirag', 'Darsh', 'Krish', 'Arnav', 'Laksh', 'Rudra', 'Shivansh',
  'Nandini', 'Sakshi', 'Trisha', 'Anika', 'Bhavya', 'Charvi', 'Divya', 'Eshani', 'Gauri', 'Jiya',
  'Manav', 'Nakul', 'Om', 'Pranay', 'Rishi', 'Sahil', 'Tejas', 'Utkarsh', 'Ved', 'Zain',
  'Khushi', 'Lavanya', 'Mira', 'Naina', 'Ojaswi', 'Palak', 'Radhika', 'Simran', 'Tanya', 'Uma'
];

const lastNames = [
  'Sharma', 'Verma', 'Patel', 'Gupta', 'Singh', 'Kumar', 'Joshi', 'Reddy', 'Nair', 'Iyer',
  'Malhotra', 'Kapoor', 'Chopra', 'Mehta', 'Agarwal', 'Mishra', 'Pandey', 'Dubey', 'Chauhan', 'Yadav',
  'Desai', 'Shah', 'Rao', 'Pillai', 'Menon', 'Kulkarni', 'Deshpande', 'Patil', 'Banerjee', 'Mukherjee'
];

const facultyNames = [
  { first: 'Dr. Rajesh', last: 'Sharma' },
  { first: 'Dr. Priya', last: 'Gupta' },
  { first: 'Prof. Suresh', last: 'Kumar' },
  { first: 'Dr. Anita', last: 'Patel' },
  { first: 'Prof. Vikram', last: 'Singh' },
  { first: 'Dr. Meenakshi', last: 'Iyer' },
  { first: 'Prof. Ramesh', last: 'Reddy' },
  { first: 'Dr. Sunita', last: 'Verma' },
  { first: 'Prof. Alok', last: 'Mishra' },
  { first: 'Dr. Kavita', last: 'Joshi' }
];

const departments = [
  { name: 'Computer Science & Engineering', code: 'CSE', hod: 'Dr. Rajesh Sharma' },
  { name: 'Electronics & Communication', code: 'ECE', hod: 'Prof. Suresh Kumar' },
  { name: 'Mechanical Engineering', code: 'ME', hod: 'Prof. Vikram Singh' },
  { name: 'Civil Engineering', code: 'CE', hod: 'Prof. Ramesh Reddy' },
  { name: 'Information Technology', code: 'IT', hod: 'Prof. Alok Mishra' }
];

const subjectsData = {
  CSE: [
    { name: 'Data Structures & Algorithms', code: 'CSE201', semester: 3, credits: 4 },
    { name: 'Database Management Systems', code: 'CSE301', semester: 5, credits: 4 },
    { name: 'Operating Systems', code: 'CSE302', semester: 5, credits: 3 },
    { name: 'Computer Networks', code: 'CSE401', semester: 7, credits: 4 }
  ],
  ECE: [
    { name: 'Digital Electronics', code: 'ECE201', semester: 3, credits: 4 },
    { name: 'Signals & Systems', code: 'ECE301', semester: 5, credits: 3 },
    { name: 'VLSI Design', code: 'ECE302', semester: 5, credits: 4 },
    { name: 'Microprocessors & Microcontrollers', code: 'ECE401', semester: 7, credits: 4 }
  ],
  ME: [
    { name: 'Engineering Mechanics', code: 'ME201', semester: 3, credits: 4 },
    { name: 'Thermodynamics', code: 'ME301', semester: 5, credits: 3 },
    { name: 'Fluid Mechanics', code: 'ME302', semester: 5, credits: 4 },
    { name: 'Machine Design', code: 'ME401', semester: 7, credits: 4 }
  ],
  CE: [
    { name: 'Structural Analysis', code: 'CE201', semester: 3, credits: 4 },
    { name: 'Geotechnical Engineering', code: 'CE301', semester: 5, credits: 3 },
    { name: 'Transportation Engineering', code: 'CE302', semester: 5, credits: 4 },
    { name: 'Environmental Engineering', code: 'CE401', semester: 7, credits: 4 }
  ],
  IT: [
    { name: 'Web Technologies', code: 'IT201', semester: 3, credits: 4 },
    { name: 'Software Engineering', code: 'IT301', semester: 5, credits: 3 },
    { name: 'Cloud Computing', code: 'IT302', semester: 5, credits: 4 },
    { name: 'Artificial Intelligence', code: 'IT401', semester: 7, credits: 4 }
  ]
};

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getWeekdaysInRange(startDate, endDate) {
  const weekdays = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      weekdays.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  return weekdays;
}

async function seed() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/attendance_system');
    console.log('✅ Connected to MongoDB\n');

    // Clear all collections
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Student.deleteMany({}),
      Faculty.deleteMany({}),
      Department.deleteMany({}),
      Course.deleteMany({}),
      Subject.deleteMany({}),
      Attendance.deleteMany({}),
      AttendanceSession.deleteMany({}),
      FaceEmbedding.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({})
    ]);
    console.log('✅ All collections cleared\n');

    // Pass raw passwords so that the User model's pre-save hook hashes them exactly once
    const adminPassword = 'admin123';
    const facultyPassword = 'faculty123';
    const studentPassword = 'student123';

    // 1. Create Admin
    console.log('👤 Creating admin account...');
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@local.com',
      password: adminPassword,
      role: 'admin',
      isActive: true
    });
    console.log('✅ Admin created: admin@local.com / admin123\n');

    // 2. Create Departments
    console.log('🏛️  Creating departments...');
    const savedDepts = await Department.insertMany(
      departments.map(d => ({ name: d.name, code: d.code, hodName: d.hod }))
    );
    const deptMap = {};
    savedDepts.forEach(d => { deptMap[d.code] = d; });
    console.log(`✅ ${savedDepts.length} departments created\n`);

    // 3. Create Subjects
    console.log('📚 Creating subjects...');
    const allSubjects = [];
    for (const [deptCode, subjects] of Object.entries(subjectsData)) {
      for (const sub of subjects) {
        allSubjects.push({
          name: sub.name,
          code: sub.code,
          department: deptMap[deptCode]._id,
          semester: sub.semester,
          creditHours: sub.credits
        });
      }
    }
    const savedSubjects = await Subject.insertMany(allSubjects);
    console.log(`✅ ${savedSubjects.length} subjects created\n`);

    // Build subject lookup by dept code
    const subjectsByDept = {};
    savedSubjects.forEach(s => {
      const dept = savedDepts.find(d => d._id.equals(s.department));
      if (!subjectsByDept[dept.code]) subjectsByDept[dept.code] = [];
      subjectsByDept[dept.code].push(s);
    });

    // 4. Create Faculty
    console.log('👨‍🏫 Creating faculty...');
    const savedFaculty = [];
    const deptCodes = Object.keys(deptMap);

    for (let i = 0; i < 10; i++) {
      const deptCode = deptCodes[Math.floor(i / 2)];
      const fn = facultyNames[i];
      const email = i === 0 ? 'faculty@local.com' : `faculty${i + 1}@local.com`;

      const user = await User.create({
        name: `${fn.first} ${fn.last}`,
        email,
        password: facultyPassword,
        role: 'faculty',
        isActive: true
      });

      const deptSubjects = subjectsByDept[deptCode] || [];
      const assignedSubjects = deptSubjects.slice(i % 2 === 0 ? 0 : 2, i % 2 === 0 ? 2 : 4).map(s => s._id);

      const faculty = await Faculty.create({
        user: user._id,
        employeeId: `FAC${String(i + 1).padStart(4, '0')}`,
        department: deptMap[deptCode]._id,
        subjects: assignedSubjects,
        designation: fn.first.startsWith('Dr.') ? 'Associate Professor' : 'Assistant Professor'
      });

      // If this faculty member is the HOD, set the hod reference in Department
      if (user.name === deptMap[deptCode].hodName) {
        await Department.findByIdAndUpdate(deptMap[deptCode]._id, { hod: faculty._id });
      }

      // Update subjects with faculty reference
      for (const subId of assignedSubjects) {
        await Subject.findByIdAndUpdate(subId, { faculty: faculty._id });
      }

      savedFaculty.push(faculty);
    }
    console.log(`✅ ${savedFaculty.length} faculty created (faculty@local.com / faculty123)\n`);

    // 5. Create Students
    console.log('🎓 Creating students...');
    const savedStudents = [];
    const usedNames = new Set();
    let nameIdx = 0;

    for (let i = 0; i < 100; i++) {
      const deptIdx = Math.floor(i / 20);
      const deptCode = deptCodes[deptIdx];
      const semester = [3, 5, 5, 7][i % 4];
      const section = i % 2 === 0 ? 'A' : 'B';

      // Get unique name
      let fullName;
      do {
        const fn = firstNames[nameIdx % firstNames.length];
        const ln = lastNames[Math.floor(nameIdx / firstNames.length) % lastNames.length];
        fullName = `${fn} ${ln}`;
        nameIdx++;
      } while (usedNames.has(fullName));
      usedNames.add(fullName);

      const email = i === 0 ? 'student@local.com' : `student${i + 1}@local.com`;

      const user = await User.create({
        name: fullName,
        email,
        password: studentPassword,
        role: 'student',
        isActive: true
      });

      const student = await Student.create({
        user: user._id,
        rollNumber: `${deptCode}${String(2023)}${String(i + 1).padStart(3, '0')}`,
        department: deptMap[deptCode]._id,
        semester,
        section,
        batch: '2023-2027',
        faceRegistered: Math.random() > 0.3 // 70% have face registered
      });

      savedStudents.push(student);
    }
    console.log(`✅ ${savedStudents.length} students created (student@local.com / student123)\n`);

    // 6. Create Attendance Sessions & Records
    console.log('📋 Creating attendance sessions and records...');
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);
    const weekdays = getWeekdaysInRange(startDate, endDate);

    let totalSessions = 0;
    let totalRecords = 0;

    // For each weekday, create sessions for some subjects
    for (const day of weekdays) {
      // Each day, 2-4 random subjects have class
      const numClasses = 2 + Math.floor(Math.random() * 3);
      const shuffledSubjects = [...savedSubjects].sort(() => Math.random() - 0.5);
      const daySubjects = shuffledSubjects.slice(0, numClasses);

      for (const subject of daySubjects) {
        // Find faculty for this subject
        const dept = savedDepts.find(d => d._id.equals(subject.department));
        const deptFaculty = savedFaculty.filter(f => f.department.equals(dept._id));
        if (deptFaculty.length === 0) continue;
        const faculty = deptFaculty[Math.floor(Math.random() * deptFaculty.length)];

        const sessionStart = new Date(day);
        sessionStart.setHours(9 + Math.floor(Math.random() * 6), 0, 0);
        const sessionEnd = new Date(sessionStart);
        sessionEnd.setMinutes(sessionEnd.getMinutes() + 50);

        // Find students in this department and semester
        const classStudents = savedStudents.filter(
          s => s.department.equals(dept._id) && s.semester === subject.semester
        );
        if (classStudents.length === 0) continue;

        let presentCount = 0;
        let absentCount = 0;

        const session = await AttendanceSession.create({
          faculty: faculty._id,
          subject: subject._id,
          department: dept._id,
          semester: subject.semester,
          section: 'A',
          date: day,
          startTime: sessionStart,
          endTime: sessionEnd,
          status: 'completed'
        });

        const attendanceRecords = [];
        for (const student of classStudents) {
          // ~80% present rate with some variation
          const rand = Math.random();
          let status;
          if (rand < 0.75) {
            status = 'present';
            presentCount++;
          } else if (rand < 0.90) {
            status = 'absent';
            absentCount++;
          } else {
            status = 'late';
            presentCount++;
          }

          attendanceRecords.push({
            student: student._id,
            subject: subject._id,
            session: session._id,
            date: day,
            status,
            faceConfidence: status !== 'absent' ? 0.75 + Math.random() * 0.24 : null,
            verificationMethod: status !== 'absent' ? 'face' : 'manual',
            markedAt: status === 'late'
              ? new Date(sessionStart.getTime() + 15 * 60000 + Math.random() * 10 * 60000)
              : new Date(sessionStart.getTime() + Math.random() * 5 * 60000)
          });
        }

        if (attendanceRecords.length > 0) {
          await Attendance.insertMany(attendanceRecords);
          totalRecords += attendanceRecords.length;
        }

        session.totalPresent = presentCount;
        session.totalAbsent = absentCount;
        await session.save();
        totalSessions++;
      }
    }
    console.log(`✅ ${totalSessions} sessions created`);
    console.log(`✅ ${totalRecords} attendance records created\n`);

    // 7. Create Face Embeddings (placeholder random descriptors)
    console.log('🎭 Creating face embeddings...');
    let faceCount = 0;
    for (const student of savedStudents) {
      if (student.faceRegistered) {
        const numSamples = 3 + Math.floor(Math.random() * 3); // 3-5 samples
        const descriptors = [];
        for (let s = 0; s < numSamples; s++) {
          // Generate random 128-dim descriptor (placeholder)
          const descriptor = Array.from({ length: 128 }, () => (Math.random() * 2 - 1));
          descriptors.push(descriptor);
        }
        await FaceEmbedding.create({
          student: student._id,
          descriptors,
          photos: [`/uploads/faces/${student._id}_1.jpg`]
        });
        faceCount++;
      }
    }
    console.log(`✅ ${faceCount} face embeddings created\n`);

    // 8. Create Notifications
    console.log('🔔 Creating notifications...');
    const notifications = [
      {
        recipient: adminUser._id,
        title: 'System Initialized',
        message: 'Face Recognition Attendance System has been set up successfully.',
        type: 'system',
        isRead: false
      },
      {
        recipient: adminUser._id,
        title: 'Low Attendance Alert',
        message: '24 students are below 75% attendance threshold.',
        type: 'low_attendance',
        isRead: false
      },
      {
        recipient: adminUser._id,
        title: 'New Semester Started',
        message: 'Attendance tracking for the new semester has begun.',
        type: 'system',
        isRead: true
      }
    ];

    // Add notifications for first faculty
    const firstFacultyUser = await User.findOne({ email: 'faculty@local.com' });
    if (firstFacultyUser) {
      notifications.push({
        recipient: firstFacultyUser._id,
        title: 'Classes Assigned',
        message: 'You have been assigned 2 new subjects for this semester.',
        type: 'system',
        isRead: false
      });
      notifications.push({
        recipient: firstFacultyUser._id,
        title: 'Attendance Reminder',
        message: 'Please mark attendance for today\'s classes.',
        type: 'system',
        isRead: false
      });
    }

    // Add notifications for first student
    const firstStudentUser = await User.findOne({ email: 'student@local.com' });
    if (firstStudentUser) {
      notifications.push({
        recipient: firstStudentUser._id,
        title: 'Attendance Warning',
        message: 'Your attendance in Data Structures is below 75%. Please attend regularly.',
        type: 'low_attendance',
        isRead: false
      });
    }

    await Notification.insertMany(notifications);
    console.log(`✅ ${notifications.length} notifications created\n`);

    // 9. Create Audit Logs
    console.log('📝 Creating audit logs...');
    const auditLogs = [
      { action: 'SYSTEM_INITIALIZED', actor: adminUser._id, actorRole: 'admin', resource: 'system', timestamp: new Date() },
      { action: 'DATABASE_SEEDED', actor: adminUser._id, actorRole: 'admin', resource: 'system', timestamp: new Date() }
    ];
    await AuditLog.insertMany(auditLogs);
    console.log(`✅ ${auditLogs.length} audit logs created\n`);

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('  🎉 DATABASE SEEDED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════');
    console.log(`  📊 Summary:`);
    console.log(`     • 1 Admin account`);
    console.log(`     • ${savedDepts.length} Departments`);
    console.log(`     • ${savedSubjects.length} Subjects`);
    console.log(`     • ${savedFaculty.length} Faculty members`);
    console.log(`     • ${savedStudents.length} Students`);
    console.log(`     • ${totalSessions} Attendance Sessions`);
    console.log(`     • ${totalRecords} Attendance Records`);
    console.log(`     • ${faceCount} Face Embeddings`);
    console.log('═══════════════════════════════════════');
    console.log('  🔑 Demo Accounts:');
    console.log('     Admin:   admin@local.com / admin123');
    console.log('     Faculty: faculty@local.com / faculty123');
    console.log('     Student: student@local.com / student123');
    console.log('═══════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
