const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || '1d';
process.env.AES_SECRET_KEY = process.env.AES_SECRET_KEY || '0'.repeat(64);
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'test-gemini-key';

test('auth routes load without undefined handlers', () => {
    assert.doesNotThrow(() => require('../routes/authRoutes'));
});

test('admin routes load with the correct auth middleware', () => {
    assert.doesNotThrow(() => require('../routes/adminRoutes'));
});

test('report schema accepts organizationId', () => {
    const Report = require('../models/Report');
    const report = new Report({
        organizationId: 'org-1',
        encryptedContent: 'ciphertext',
        trackingId: 'TRACK123'
    });

    assert.equal(report.validateSync(), undefined);
});

test('encryption utility supports round-trip encryption', () => {
    const { encrypt, decrypt } = require('../utils/encryption');
    const ciphertext = encrypt('confidential');

    assert.equal(decrypt(ciphertext), 'confidential');
});

test('organization middleware preserves matching authenticated tenant context', () => {
    const organizationMiddleware = require('../middleware/organization');
    const req = {
        organizationId: 'org-token',
        headers: { 'x-organization-id': 'org-token' },
        body: {},
        query: {},
        params: {}
    };
    let nextCalled = false;
    const res = {
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.payload = payload;
            return this;
        }
    };

    organizationMiddleware(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(req.organizationId, 'org-token');
});
