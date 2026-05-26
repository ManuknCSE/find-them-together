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

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next();

    try {
      socket.user = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      return next();
    } catch (error) {
      return next(new Error('Invalid socket token'));
    }
  });

  io.on('connection', (socket) => {
    if (socket.user?.id) socket.join(`user:${socket.user.id}`);
    socket.on('join-case', (caseId) => socket.join(`case:${caseId}`));
    socket.on('volunteer-location', (payload) => {
      socket.broadcast.emit('volunteer-location:update', payload);
    });
    socket.on('disconnect', () => logger.info(`Socket disconnected ${socket.id}`));
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = { initSocket, getIO };

