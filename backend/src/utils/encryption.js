const crypto = require('crypto');

function getKey() {
  const configured = process.env.ENCRYPTION_KEY || '';
  if (!configured) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY environment variable is required in production');
    }
    // Dev only: deterministic dev key (NOT for production use)
    return require('crypto').createHash('sha256').update('findthem-dev-only').digest();
  }
  const decoded = Buffer.from(configured, configured.length === 64 ? 'hex' : 'base64');
  if (decoded.length === 32) return decoded;
  return require('crypto').createHash('sha256').update(configured).digest();
}

function encryptString(value) {
  if (!value) return value;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

function decryptString(payload) {
  if (!payload || !payload.includes(':')) return payload;
  const [ivRaw, tagRaw, encryptedRaw] = payload.split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivRaw, 'base64'));
  decipher.setAuthTag(Buffer.from(tagRaw, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, 'base64')),
    decipher.final()
  ]);
  return decrypted.toString('utf8');
}

module.exports = { encryptString, decryptString };
