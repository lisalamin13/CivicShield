const AuditLog = require('../models/AuditLog');

const auditLogger = (action) => {
    return async (req, res, next) => {
        try {
            // We record the action AFTER the request finishes successfully
            res.on('finish', async () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    await AuditLog.create({
                        organizationId: req.organizationId,
                        staffId: req.staffId || null, // Populated by your Auth middleware
                        action: action,
                        targetId: req.params.reportId || req.params.trackingId || "General",
                        ipAddress: req.ip,
                        details: `Method: ${req.method} | Path: ${req.originalUrl}`
                    });
                }
            });
            next();
        } catch (err) {
            console.error("Audit Logging Error:", err);
            next(); // Don't crash the app if logging fails
        }
    };
};

module.exports = auditLogger;