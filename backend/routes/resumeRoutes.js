const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { upload, createResume, getResumes, getResumeById, deleteResume } = require('../controllers/resumeController');

const router = express.Router();

router.post('/upload', protect, upload.single('resume'), createResume);
router.get('/', protect, getResumes);
router.get('/:id', protect, getResumeById);
router.delete('/:id', protect, deleteResume);

module.exports = router;
