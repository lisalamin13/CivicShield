const crypto = require('node:crypto');

const getKey = () => {
  const rawSecret = process.env.CRYPTO_SECRET || 'civicshield-dev-secret-change-me';
  return crypto.createHash('sha256').update(rawSecret).digest();
};

const encryptText = (value) => {
  if (!value) {
    return null;
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':');
};

const decryptText = (value) => {
  if (!value) {
    return null;
  }

  const [ivHex, tagHex, encryptedHex] = value.split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, 'hex')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
};

const hashValue = (value) =>
  crypto.createHash('sha256').update(String(value)).digest('hex');

const generateRandomToken = (length = 32) =>
  crypto.randomBytes(length).toString('hex');

module.exports = {
  decryptText,
  encryptText,
  generateRandomToken,
  hashValue,
};
