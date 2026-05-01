const { PDFDocument } = require('pdf-lib');
const sharp = require('sharp');

const imageFormatMap = {
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const scrubUploadedFile = async (file) => {
  if (imageFormatMap[file.mimetype]) {
    const buffer = await sharp(file.buffer).rotate().toFormat(imageFormatMap[file.mimetype]).toBuffer();
    return {
      buffer,
      scrubbed: true,
      scrubNotes: 'Image metadata removed via re-encoding.',
    };
  }

  if (file.mimetype === 'application/pdf') {
    const pdf = await PDFDocument.load(file.buffer);
    pdf.setTitle('');
    pdf.setAuthor('');
    pdf.setSubject('');
    pdf.setProducer('CivicShield');
    pdf.setCreator('CivicShield');

    return {
      buffer: await pdf.save(),
      scrubbed: true,
      scrubNotes: 'PDF metadata normalized.',
    };
  }

  return {
    buffer: file.buffer,
    scrubbed: false,
    scrubNotes: 'Metadata scrubbing not supported for this file type.',
  };
};

module.exports = {
  scrubUploadedFile,
};
