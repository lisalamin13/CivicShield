const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const ivLength = 16;

const getEncryptionKey = () => {
    const secret = process.env.AES_SECRET_KEY;
    if (!secret) {
        throw new Error('AES_SECRET_KEY is not configured.');
    }

    const key = Buffer.from(secret, 'hex');
    if (key.length !== 32) {
        throw new Error('AES_SECRET_KEY must be a 64-character hex string.');
    }

    return key;
};

exports.encrypt = (text) => {
    if (typeof text !== 'string' || text.length === 0) {
        throw new Error('Text to encrypt must be a non-empty string.');
    }

    const iv = crypto.randomBytes(ivLength);
    const cipher = crypto.createCipheriv(algorithm, getEncryptionKey(), iv);
    let encrypted = cipher.update(text, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

exports.decrypt = (payload) => {
    if (typeof payload !== 'string' || !payload.includes(':')) {
        throw new Error('Encrypted payload is malformed.');
    }

    const [ivHex, encryptedHex] = payload.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, getEncryptionKey(), iv);

    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
};
