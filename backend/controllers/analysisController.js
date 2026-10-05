const Analysis = require('../models/Analysis');
const Resume = require('../models/Resume');
const fallbackStore = require('../utils/fallbackStore');
const { isDatabaseAvailable } = require('../config/db');
const { generateAnalysis } = require('../services/aiService');

const createAnalysis = async (req, res) => {
  try {
    const { resumeId, targetRole, jobDescription } = req.body;

    if (!resumeId || !targetRole) {
      return res.status(400).json({ success: false, message: 'Resume and target role are required.' });
    }

    let resume;

    if (isDatabaseAvailable()) {
      resume = await Resume.findOne({ _id: resumeId, userId: req.user._id });
    } else {
      resume = fallbackStore.resumes.find((entry) => entry._id.toString() === resumeId && entry.userId === req.user._id.toString());
    }

    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found.' });
    }

    const analysisResult = await generateAnalysis({
      resumeText: resume.extractedText,
      targetRole,
      jobDescription: jobDescription || '',
    });

    const payload = {
      userId: req.user._id,
      resumeId: resume._id,
      targetRole,
      atsScore: analysisResult.atsScore,
      matchScore: analysisResult.matchScore,
      matchedSkills: analysisResult.matchedSkills,
      missingSkills: analysisResult.missingSkills,
      strengths: analysisResult.strengths,
      weaknesses: analysisResult.weaknesses,
      keywordAnalysis: analysisResult.keywordAnalysis,
      recommendations: analysisResult.recommendations,
      createdAt: new Date(),
    };

    if (isDatabaseAvailable()) {
      const analysis = await Analysis.create(payload);
      return res.status(201).json({ success: true, analysis });
    }

    const fallbackAnalysis = {
      _id: Date.now().toString(),
      ...payload,
      userId: req.user._id.toString ? req.user._id.toString() : req.user._id,
      resumeId: resume._id.toString ? resume._id.toString() : resume._id,
    };

    fallbackStore.analyses.push(fallbackAnalysis);
    return res.status(201).json({ success: true, analysis: fallbackAnalysis });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to create the analysis. Please try again.' });
  }
};

const getAnalyses = async (req, res) => {
  try {
    if (isDatabaseAvailable()) {
      const analyses = await Analysis.find({ userId: req.user._id }).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, analyses });
    }

    const analyses = fallbackStore.analyses.filter((analysis) => analysis.userId === req.user._id.toString());
    return res.status(200).json({ success: true, analyses });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to load analysis history.' });
  }
};

const getAnalysisById = async (req, res) => {
  try {
    if (isDatabaseAvailable()) {
      const analysis = await Analysis.findOne({ _id: req.params.id, userId: req.user._id });
      if (!analysis) {
        return res.status(404).json({ success: false, message: 'Analysis not found.' });
      }
      return res.status(200).json({ success: true, analysis });
    }

    const analysis = fallbackStore.analyses.find((entry) => entry._id.toString() === req.params.id && entry.userId === req.user._id.toString());
    if (!analysis) {
      return res.status(404).json({ success: false, message: 'Analysis not found.' });
    }
    return res.status(200).json({ success: true, analysis });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to load analysis details.' });
  }
};

const deleteAnalysis = async (req, res) => {
  try {
    if (isDatabaseAvailable()) {
      const removed = await Analysis.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
      if (!removed) {
        return res.status(404).json({ success: false, message: 'Analysis not found.' });
      }
      return res.status(200).json({ success: true, message: 'Analysis deleted.' });
    }

    const index = fallbackStore.analyses.findIndex((entry) => entry._id.toString() === req.params.id && entry.userId === req.user._id.toString());
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Analysis not found.' });
    }

    fallbackStore.analyses.splice(index, 1);
    return res.status(200).json({ success: true, message: 'Analysis deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to delete analysis.' });
  }
};

module.exports = {
  createAnalysis,
  getAnalyses,
  getAnalysisById,
  deleteAnalysis,
};
