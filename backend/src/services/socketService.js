const { getIO } = require('../config/socket');

function emitToUser(userId, event, payload) {
  const io = getIO();
  if (io && userId) io.to(`user:${userId}`).emit(event, payload);
}

function emitToCase(caseId, event, payload) {
  const io = getIO();
  if (io && caseId) io.to(`case:${caseId}`).emit(event, payload);
}

function emitGlobal(event, payload) {
  const io = getIO();
  if (io) io.emit(event, payload);
}

module.exports = { emitToUser, emitToCase, emitGlobal };

