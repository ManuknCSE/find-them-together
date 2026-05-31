const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL?.split(',') || '*',
      credentials: true
    }
  });

  // Auth middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(); // Allow unauthenticated connections (read-only)

    try {
      socket.user = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      return next();
    } catch (error) {
      return next(new Error('Invalid socket token'));
    }
  });

  io.on('connection', (socket) => {
    if (socket.user?.id) {
      socket.join(`user:${socket.user.id}`);
      logger.info(`Socket connected: user ${socket.user.id}`);
    }

    // BUG-015: Only authenticated users can join case rooms
    socket.on('join-case', (caseId) => {
      if (!socket.user?.id) {
        socket.emit('error', { message: 'Authentication required to join case rooms' });
        return;
      }
      if (typeof caseId !== 'string' || caseId.length !== 24) return;
      socket.join(`case:${caseId}`);
    });

    // BUG-015: Only authenticated users can broadcast volunteer location
    socket.on('volunteer-location', (payload) => {
      if (!socket.user?.id) return; // silently ignore unauthenticated
      const { lat, lng, caseId } = payload || {};
      if (typeof lat !== 'number' || typeof lng !== 'number') return;
      // SEC-04 FIX: Only broadcast to the specific case room, never globally
      if (typeof caseId === 'string' && caseId.length === 24) {
        socket.to(`case:${caseId}`).emit('volunteer-location:update', {
          userId: socket.user.id,
          lat,
          lng,
          caseId
        });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = { initSocket, getIO };
