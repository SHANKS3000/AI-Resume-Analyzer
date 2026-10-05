const { roleSkills } = require('../utils/roleCatalog');

const normalizeText = (value = '') => value.toLowerCase();

const extractSkillHits = (text, skillList) => {
  const normalizedText = normalizeText(text);
  return skillList.filter((skill) => normalizedText.includes(skill.toLowerCase()));
};

const getCanonicalSkills = (targetRole = '') => {
  return roleSkills[targetRole] || Object.values(roleSkills).flat();
};

const analyzeResumeLocally = ({ resumeText, targetRole, jobDescription }) => {
  const text = resumeText || '';
  const roleKeywords = getCanonicalSkills(targetRole);
  const jobKeywords = (jobDescription || '').toLowerCase().split(/[^a-z0-9+#./]+/).filter(Boolean);
  const normalizedResumeText = normalizeText(text);

  const matchedSkills = [...new Set([...extractSkillHits(text, roleKeywords), ...extractSkillHits(text, roleKeywords)])].filter(Boolean);
  const allRoleCandidates = [...new Set([...roleKeywords, ...jobKeywords.map((word) => word.trim())])].filter((keyword) => keyword.length > 2);
  const matchedKeywords = [...new Set(allRoleCandidates.filter((keyword) => normalizedResumeText.includes(keyword.toLowerCase())))];
  const missingSkills = [...new Set(allRoleCandidates.filter((keyword) => !normalizedResumeText.includes(keyword.toLowerCase())))].slice(0, 8);

  const atsScore = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        35 +
          (matchedKeywords.length / Math.max(1, allRoleCandidates.length)) * 50 +
          (text.length > 1000 ? 10 : 5) +
          (text.includes('experience') || text.includes('project') ? 5 : 0)
      )
    )
  );

  const matchScore = Math.min(
    100,
    Math.max(
      0,
      Math.round((matchedSkills.length / Math.max(1, roleKeywords.length)) * 100 * 0.8 + (matchedKeywords.length / Math.max(1, allRoleCandidates.length)) * 100 * 0.2)
    )
  );

  const strengths = [];
  if (text.includes('project') || text.includes('experience')) strengths.push('Clear project and experience context is present.');
  if (matchedSkills.length > 0) strengths.push('The resume includes relevant technical skills for the target role.');
  if (text.includes('education') || text.includes('bachelor') || text.includes('master')) strengths.push('Academic background and qualifications are visible.');

  const weaknesses = [];
  if (matchedSkills.length < 3) weaknesses.push('The resume could include more role-specific keywords to improve fit.');
  if (!text.includes('project') && !text.includes('experience')) weaknesses.push('Add concrete projects or work experience to strengthen the resume.');
  if (text.includes('worked on a website') || text.includes('helped with')) weaknesses.push('Use measurable impact statements with outcomes and numbers where possible.');

  const keywordAnalysis = {
    targetKeywords: allRoleCandidates.slice(0, 12),
    foundKeywords: matchedKeywords.slice(0, 12),
    missingKeywords: missingSkills.slice(0, 12),
  };

  const recommendations = [
    'Add more keywords related to the target job description.',
    'Improve your professional summary to align with the target role.',
    'Add measurable achievement statements to your experience and projects.',
    'Include the most relevant technical skills in a dedicated skills section.',
    'Highlight projects that match the role requirements and business impact.',
  ];

  return {
    atsScore,
    matchScore,
    matchedSkills: matchedSkills.slice(0, 10),
    missingSkills: missingSkills.slice(0, 10),
    strengths: strengths.slice(0, 5),
    weaknesses: weaknesses.slice(0, 5),
    keywordAnalysis,
    recommendations,
  };
};

const generateAnalysis = async ({ resumeText, targetRole, jobDescription }) => {
  const apiKey = process.env.AI_API_KEY;

  if (apiKey && process.env.AI_PROVIDER === 'openai') {
    try {
      // Modular provider hook for future LLM integration.
      // This project intentionally keeps the abstraction behind a provider-specific adapter.
      return analyzeResumeLocally({ resumeText, targetRole, jobDescription });
    } catch (error) {
      console.warn('AI provider failed; falling back to local analysis:', error.message);
      return analyzeResumeLocally({ resumeText, targetRole, jobDescription });
    }
  }

  return analyzeResumeLocally({ resumeText, targetRole, jobDescription });
};

module.exports = { generateAnalysis };
