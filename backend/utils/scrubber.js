const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

exports.scrubImage = async (file) => 
{
    const outputPath = path.join('uploads/scrubbed', `scrubbed-${file.filename}`);
    
    // Sharp automatically strips EXIF metadata unless .withMetadata() is called
    await sharp(file.path)
        .toFile(outputPath);

    // Delete the original "dirty" file with metadata
    fs.unlinkSync(file.path);

    return outputPath;
};