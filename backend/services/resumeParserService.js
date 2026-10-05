const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');

const extractTextFromFile = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();

  try {
    if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const parser = new PDFParse({ data: dataBuffer });
      try {
        const pdfData = await parser.getText();
        return pdfData.text || '';
      } finally {
        await parser.destroy();
      }
    }

    if (ext === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value || '';
    }

    throw new Error('Unsupported file type.');
  } catch (error) {
    throw new Error('Failed to extract text. Please upload a valid PDF or DOCX resume.');
  }
};

module.exports = { extractTextFromFile };
