const express = require('express');
const router = express.Router();
const multer = require('multer');

// REMOVE the curly braces because you exported the function directly
const extractOrgId = require('../middleware/organization'); 

// Ensure the controller is imported correctly too
const { uploadAndScrub } = require('../controllers/evidenceController');

// Configure temporary storage for Level 2: Whistleblower Core
const upload = multer({ dest: 'uploads/temp/' });

// POST /api/v1/evidence/upload
// Now 'extractOrgId' is a valid function and won't throw a TypeError
router.post('/upload', extractOrgId, upload.single('evidence'), uploadAndScrub);

module.exports = router;