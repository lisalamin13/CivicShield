const getSuppliedOrganizationId = (req) =>
    req.headers['x-organization-id'] ||
    req.body?.organizationId ||
    req.body?.organization ||
    req.query?.organizationId ||
    req.query?.orgId ||
    req.params?.orgId;

const organizationMiddleware = (req, res, next) => {
    const suppliedOrganizationId = getSuppliedOrganizationId(req);

    if (req.organizationId) {
        if (suppliedOrganizationId && String(suppliedOrganizationId) !== String(req.organizationId)) {
            return res.status(403).json({
                success: false,
                error: 'Organization context does not match the authenticated user.'
            });
        }

        return next();
    }

    if (!suppliedOrganizationId) {
        return res.status(400).json({
            success: false,
            error: 'Organization ID is required in x-organization-id, request body, query, or route params.'
        });
    }

    req.organizationId = String(suppliedOrganizationId);
    next();
};

module.exports = organizationMiddleware;
