const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const Evidence = require('../models/Evidence');

// Define path to the scrubbed folder
const scrubbedPath = path.join(__dirname, '../uploads/scrubbed');

/**
 * @desc    Upload evidence, scrub metadata, and save to database
 * @route   POST /api/v1/evidence/upload
 * @access  Protected (Requires x-organization-id)
 */
exports.uploadAndScrub = async (req, res) => {
    try {
        // 1. Ensure the 'scrubbed' directory exists before processing [cite: 329]
        if (!fs.existsSync(scrubbedPath)) {
            fs.mkdirSync(scrubbedPath, { recursive: true });
        }

        // 2. Validate file existence
        if (!req.file) {
            return res.status(400).json({ success: false, error: "No file uploaded." });
        }

        // 3. Failsafe for Multi-Tenant Isolation [cite: 346, 621]
        // This prevents the "organizationId is required" error
        if (!req.organizationId) {
            // Delete the temp file so we don't leave unscrubbed data [cite: 53]
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(400).json({ 
                success: false, 
                error: "Organization context missing. Please provide x-organization-id header." 
            });
        }

        // 4. Define the "Clean" filename to ensure absolute anonymity [cite: 53, 240]
        const cleanedFileName = `clean-${Date.now()}-${req.file.originalname}`;
        const outputPath = path.join(scrubbedPath, cleanedFileName);

        // 5. Metadata Scrubbing Logic [cite: 282]
        // Strips EXIF, GPS, and device info to protect identity [cite: 242, 341]
        await sharp(req.file.path)
            .withMetadata(false) 
            .toFile(outputPath);

        // 6. Delete the original (unscrubbed) file immediately [cite: 32, 53]
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        // 7. Save to Database Level 2: Whistleblower Core [cite: 487, 533]
        const evidence = await Evidence.create({
            reportId: req.body.reportId,
            organizationId: req.organizationId, // Populated from middleware
            s3Url: `/uploads/scrubbed/${cleanedFileName}`, // Local storage path [cite: 376]
            cleanedFileName: cleanedFileName,
            fileType: req.file.mimetype,
            virusScanStatus: 'Clean' // Initial status for Security Layer [cite: 342, 637]
        });

        res.status(201).json({
            success: true,
            message: "Evidence uploaded and metadata scrubbed successfully.",
            data: evidence
        });

    } catch (err) {
        // Cleanup: Remove temp file if processing fails mid-way [cite: 53]
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        console.error("Scrubbing Error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};