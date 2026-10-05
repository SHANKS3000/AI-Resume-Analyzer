const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { createAnalysis, getAnalyses, getAnalysisById, deleteAnalysis } = require('../controllers/analysisController');

const router = express.Router();

router.post('/', protect, createAnalysis);
router.get('/', protect, getAnalyses);
router.get('/:id', protect, getAnalysisById);
router.delete('/:id', protect, deleteAnalysis);

module.exports = router;
