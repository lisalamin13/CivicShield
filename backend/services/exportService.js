const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

const buildReportsCsv = (reports) => {
  const parser = new Parser({
    fields: ['trackingCode', 'subject', 'category', 'department', 'status', 'priority', 'createdAt'],
  });

  return parser.parse(
    reports.map((report) => ({
      trackingCode: report.trackingCode,
      subject: report.subject,
      category: report.category,
      department: report.department,
      status: report.status,
      priority: report.priority,
      createdAt: report.createdAt,
    })),
  );
};

const buildReportsPdf = (reports) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).text('CivicShield Report Export', { align: 'left' });
    doc.moveDown();

    reports.forEach((report) => {
      doc
        .fontSize(12)
        .text(`${report.trackingCode} | ${report.subject}`)
        .fontSize(10)
        .text(`Category: ${report.category}`)
        .text(`Department: ${report.department || 'N/A'}`)
        .text(`Status: ${report.status}`)
        .text(`Priority: ${report.priority}`)
        .text(`Created: ${new Date(report.createdAt).toLocaleString()}`)
        .moveDown();
    });

    doc.end();
  });

module.exports = {
  buildReportsCsv,
  buildReportsPdf,
};
