const organizationMiddleware = (req, res, next) => 
{
    const organizationId = req.headers['x-organization-id'];
    
    if (!organizationId) 
    {
        return res.status(400).json({ 
            success: false, 
            error: "Organization ID (x-organization-id) is missing from headers." 
        });
    }
    
    req.organizationId = organizationId;
    next();
};

module.exports = organizationMiddleware;