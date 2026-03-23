const crypto = require('crypto');

const algorithm = 'aes-256-cbc';

const key = Buffer.from(process.env.AES_SECRET_KEY, 'hex'); 
const ivLength = 16; 

exports.encrypt = (text) => 
{
    const iv = crypto.randomBytes(ivLength);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
};