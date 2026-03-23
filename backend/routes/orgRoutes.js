const express = require('express');
const router = express.Router();
const Organization = require('../models/Organization');

// This handles POST requests to /api/v1/orgs
router.post('/', async (req, res) => 
{
    try 
    {
        const org = await Organization.create(req.body);
        res.status(201).json({ success: true, data: org });
    } 
    catch (err) 
    {
        res.status(400).json({ success: false, error: err.message });
    }
});

module.exports = router;