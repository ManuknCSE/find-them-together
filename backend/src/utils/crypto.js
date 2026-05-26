const crypto = require('crypto');

function hashValue(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

module.exports = { hashValue, randomToken };

