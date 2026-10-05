const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Resume = require('../models/Resume');
const fallbackStore = require('../utils/fallbackStore');
const { isDatabaseAvailable } = require('../config/db');
const { extractTextFromFile } = require('../services/resumeParserService');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = file.originalname.replace(ext, '').replace(/\s+/g, '-');
    cb(null, `${Date.now()}-${baseName}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowed.includes(ext)) {
    return cb(new Error('Only PDF and DOCX files are accepted.'));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const createResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No resume file was uploaded.' });
    }

    const extractedText = await extractTextFromFile(req.file.path);

    if (!extractedText || !extractedText.trim()) {
      return res.status(400).json({ success: false, message: 'The uploaded file could not be read. Please upload a valid resume.' });
    }

    const payload = {
      userId: req.user._id,
      fileName: req.file.originalname,
      filePath: `/uploads/${req.file.filename}`,
      extractedText,
      targetRole: req.body.targetRole || '',
      uploadedAt: new Date(),
    };

    if (isDatabaseAvailable()) {
      const resume = await Resume.create(payload);
      return res.status(201).json({ success: true, resume });
    }

    const fallbackResume = {
      _id: Date.now().toString(),
      ...payload,
      userId: req.user._id.toString ? req.user._id.toString() : req.user._id,
    };
    fallbackStore.resumes.push(fallbackResume);
    return res.status(201).json({ success: true, resume: fallbackResume });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message || 'Unable to process the resume.' });
  }
};

const getResumes = async (req, res) => {
  try {
    if (isDatabaseAvailable()) {
      const resumes = await Resume.find({ userId: req.user._id }).sort({ uploadedAt: -1 });
      return res.status(200).json({ success: true, resumes });
    }

    const resumes = fallbackStore.resumes.filter((resume) => resume.userId === req.user._id.toString());
    return res.status(200).json({ success: true, resumes });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to load resumes.' });
  }
};

const getResumeById = async (req, res) => {
  try {
    if (isDatabaseAvailable()) {
      const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id });
      if (!resume) {
        return res.status(404).json({ success: false, message: 'Resume not found.' });
      }
      return res.status(200).json({ success: true, resume });
    }

    const resume = fallbackStore.resumes.find((entry) => entry._id.toString() === req.params.id && entry.userId === req.user._id.toString());
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found.' });
    }
    return res.status(200).json({ success: true, resume });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to fetch resume details.' });
  }
};

const deleteResume = async (req, res) => {
  try {
    if (isDatabaseAvailable()) {
      const deleted = await Resume.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Resume not found.' });
      }
      return res.status(200).json({ success: true, message: 'Resume deleted.' });
    }

    const index = fallbackStore.resumes.findIndex((entry) => entry._id.toString() === req.params.id && entry.userId === req.user._id.toString());
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Resume not found.' });
    }

    fallbackStore.resumes.splice(index, 1);
    return res.status(200).json({ success: true, message: 'Resume deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to delete resume.' });
  }
};

module.exports = {
  upload,
  createResume,
  getResumes,
  getResumeById,
  deleteResume,
};
