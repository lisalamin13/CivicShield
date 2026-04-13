const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Staff = require('../models/Staff');
const SuperAdmin = require('../models/superAdmin');

const loadPrincipal = async (decoded) => {
    if (decoded.actorType === 'user') {
        return { principal: await User.findById(decoded.id), actorType: 'user' };
    }

    if (decoded.actorType === 'staff') {
        return { principal: await Staff.findById(decoded.id), actorType: 'staff' };
    }

    if (decoded.actorType === 'super_admin') {
        return { principal: await SuperAdmin.findById(decoded.id), actorType: 'super_admin' };
    }

    const user = await User.findById(decoded.id);
    if (user) {
        return { principal: user, actorType: 'user' };
    }

    const staff = await Staff.findById(decoded.id);
    if (staff) {
        return { principal: staff, actorType: 'staff' };
    }

    const superAdmin = await SuperAdmin.findById(decoded.id);
    if (superAdmin) {
        return { principal: superAdmin, actorType: 'super_admin' };
    }

    return { principal: null, actorType: decoded.actorType };
};

exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, error: 'Not authorized.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { principal, actorType } = await loadPrincipal(decoded);

        if (!principal) {
            return res.status(401).json({ success: false, error: 'Not authorized.' });
        }

        req.auth = decoded;
        req.actorType = actorType;
        req.actor = principal;
        req.user = principal;
        req.role = principal.role || decoded.role;

        const organizationId = decoded.organizationId || principal.organizationId || principal.organization;
        if (organizationId) {
            req.organizationId = String(organizationId);
        }

        if (actorType === 'staff') {
            req.staff = principal;
            req.staffId = principal._id;
        }

        if (actorType === 'super_admin') {
            req.superAdmin = principal;
        }

        next();
    } catch (err) {
        return res.status(401).json({ success: false, error: 'Not authorized.' });
    }
};

exports.authorize = (...allowedRoles) => (req, res, next) => {
    const currentRole = req.role || req.user?.role;

    if (!currentRole || !allowedRoles.includes(currentRole)) {
        return res.status(403).json({
            success: false,
            error: 'You do not have permission to access this resource.'
        });
    }

    next();
};
