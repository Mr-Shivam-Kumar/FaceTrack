const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = function(io) {
  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('User not found'));
      }
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`📡 Socket connected: ${socket.user.name} (${socket.user.role})`);

    // Join user-specific room for notifications
    socket.join(`user:${socket.user._id}`);
    socket.join(`role:${socket.user.role}`);

    // Join attendance session room
    socket.on('join:session', (sessionId) => {
      socket.join(`session:${sessionId}`);
      console.log(`👤 ${socket.user.name} joined session: ${sessionId}`);
    });

    // Leave attendance session room
    socket.on('leave:session', (sessionId) => {
      socket.leave(`session:${sessionId}`);
      console.log(`👤 ${socket.user.name} left session: ${sessionId}`);
    });

    // Attendance marked event - broadcast to session
    socket.on('attendance:mark', (data) => {
      io.to(`session:${data.sessionId}`).emit('attendance:marked', {
        studentId: data.studentId,
        studentName: data.studentName,
        rollNumber: data.rollNumber,
        confidence: data.confidence,
        timestamp: new Date(),
        photo: data.photo
      });
    });

    // Session started - notify relevant users
    socket.on('session:start', (data) => {
      io.to(`role:admin`).emit('session:started', data);
      io.to(`role:student`).emit('session:started', data);
    });

    // Session ended - notify relevant users
    socket.on('session:end', (data) => {
      io.to(`session:${data.sessionId}`).emit('session:ended', data);
      io.to(`role:admin`).emit('session:ended', data);
    });

    // Dashboard refresh request
    socket.on('dashboard:refresh', () => {
      io.to(`role:admin`).emit('dashboard:update');
    });

    // Notification push
    socket.on('notification:send', (data) => {
      if (data.userId) {
        io.to(`user:${data.userId}`).emit('notification:new', data.notification);
      } else if (data.role) {
        io.to(`role:${data.role}`).emit('notification:new', data.notification);
      }
    });

    socket.on('disconnect', () => {
      console.log(`📡 Socket disconnected: ${socket.user.name}`);
    });
  });
};
