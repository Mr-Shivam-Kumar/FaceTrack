const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('./config/db');

// Create Express app
const app = express();
const httpServer = createServer(app);

// CORS Whitelist Configuration
const allowedOrigins = process.env.CLIENT_URL 
  ? process.env.CLIENT_URL.split(',').map(o => o.trim()) 
  : [];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, server-to-server)
    if (!origin) return callback(null, true);
    
    // Enforce whitelist in production if CLIENT_URL is provided
    if (process.env.NODE_ENV === 'production' && allowedOrigins.length > 0) {
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    }
    
    // Allow all for development or fallback
    callback(null, true);
  },
  credentials: true
};

// Socket.io
const io = new Server(httpServer, {
  cors: {
    ...corsOptions,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Create required directories
const dirs = [
  path.join(__dirname, '..', 'uploads', 'faces'),
  path.join(__dirname, '..', 'reports')
];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Static files - serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/reports', express.static(path.join(__dirname, '..', 'reports')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/faculty', require('./routes/faculty'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/face', require('./routes/face'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/search', require('./routes/search'));
app.use('/api/audit-logs', require('./routes/auditLogs'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date() });
});

// Error handler
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// Socket.io handler
require('./sockets/socketHandler')(io);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 Socket.io ready`);
      console.log(`🗃️  MongoDB connected`);
      console.log(`\n📋 API Endpoints:`);
      console.log(`   Auth:          http://localhost:${PORT}/api/auth`);
      console.log(`   Students:      http://localhost:${PORT}/api/students`);
      console.log(`   Faculty:       http://localhost:${PORT}/api/faculty`);
      console.log(`   Departments:   http://localhost:${PORT}/api/departments`);
      console.log(`   Attendance:    http://localhost:${PORT}/api/attendance`);
      console.log(`   Sessions:      http://localhost:${PORT}/api/sessions`);
      console.log(`   Face:          http://localhost:${PORT}/api/face`);
      console.log(`   Dashboard:     http://localhost:${PORT}/api/dashboard`);
      console.log(`   Reports:       http://localhost:${PORT}/api/reports`);
      console.log(`   Notifications: http://localhost:${PORT}/api/notifications`);
      console.log(`   Search:        http://localhost:${PORT}/api/search\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
