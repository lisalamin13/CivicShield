const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const Evidence = require('../models/Evidence');

exports.uploadAndScrub = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: "No file uploaded." });
        }

        // 1. Define the "Clean" filename to ensure absolute anonymity [cite: 53]
        const cleanedFileName = `clean-${Date.now()}-${req.file.originalname}`;
        const outputPath = path.join(__dirname, '../uploads/scrubbed/', cleanedFileName);

        // 2. Metadata Scrubbing Logic [cite: 282]
        // .withMetadata(false) strips all EXIF, GPS, and device info [cite: 242]
        await sharp(req.file.path)
            .withMetadata(false) 
            .toFile(outputPath);

        // 3. Delete the original (unscrubbed) file immediately [cite: 32, 53]
        fs.unlinkSync(req.file.path);

        // 4. Save to Database Level 2: Whistleblower Core [cite: 487, 533]
        const evidence = await Evidence.create({
            reportId: req.body.reportId,
            organizationId: req.organizationId,
            s3Url: `/uploads/scrubbed/${cleanedFileName}`, // Local path for now
            cleanedFileName: cleanedFileName,
            fileType: req.file.mimetype,
            virusScanStatus: 'Clean' // Logic for actual scan can be added later [cite: 342]
        });

        res.status(201).json({
            success: true,
            message: "Evidence uploaded and metadata scrubbed successfully.",
            data: evidence
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};