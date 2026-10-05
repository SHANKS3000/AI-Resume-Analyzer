const roleSkills = {
  'Software Developer': ['javascript', 'python', 'java', 'node.js', 'react', 'sql', 'git', 'api'],
  'Full Stack Developer': ['javascript', 'node.js', 'react', 'express', 'mongodb', 'sql', 'api', 'git'],
  'Frontend Developer': ['html', 'css', 'javascript', 'react', 'ui', 'ux', 'typescript', 'git'],
  'Backend Developer': ['node.js', 'express', 'api', 'mongodb', 'sql', 'java', 'python', 'docker'],
  'Data Scientist': ['python', 'sql', 'machine learning', 'statistics', 'pandas', 'numpy', 'tableau', 'data analysis'],
  'Data Analyst': ['sql', 'excel', 'python', 'power bi', 'dashboard', 'statistics', 'analytics'],
  'AI/ML Engineer': ['python', 'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'sql', 'data analysis'],
  'DevOps Engineer': ['docker', 'kubernetes', 'aws', 'ci/cd', 'linux', 'bash', 'terraform', 'git'],
  'Cybersecurity Engineer': ['security', 'networking', 'linux', 'python', 'siem', 'aws', 'incident response'],
};

const roleExperienceHints = {
  'Software Developer': ['projects', 'web application', 'software engineering', 'debugging'],
  'Full Stack Developer': ['frontend', 'backend', 'database', 'api'],
  'Frontend Developer': ['ui', 'ux', 'responsive design', 'user interface'],
  'Backend Developer': ['server', 'database', 'api', 'performance'],
  'Data Scientist': ['modeling', 'analysis', 'experiments', 'data'],
  'Data Analyst': ['reporting', 'dashboards', 'metrics', 'business intelligence'],
  'AI/ML Engineer': ['model training', 'deployment', 'machine learning pipeline'],
  'DevOps Engineer': ['deployment', 'automation', 'infrastructure', 'cloud'],
  'Cybersecurity Engineer': ['vulnerability', 'security operations', 'risk assessment'],
};

module.exports = {
  roleSkills,
  roleExperienceHints,
};
