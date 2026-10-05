const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

const stripHtml = (value = '') => value.replace(/<[^>]*>/g, '');

async function loadReport() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    document.getElementById('reportContent').innerHTML = '<div class="empty-state">No analysis selected.</div>';
    return;
  }

  try {
    const analysisRes = await apiRequest(`/api/analysis/${id}`);
    const analysis = analysisRes.analysis;
    const resumeRes = await apiRequest(`/api/resumes/${analysis.resumeId}`);

    const currentResume = resumeRes.resume || {};
    const resultHtml = `
      <div class="report-summary">
        <div class="metric"><span>Resume</span><strong>${currentResume.fileName || 'Uploaded Resume'}</strong></div>
        <div class="metric"><span>Target Role</span><strong>${analysis.targetRole}</strong></div>
        <div class="metric"><span>ATS Score</span><strong>${analysis.atsScore || 0}/100</strong></div>
        <div class="metric"><span>Match Score</span><strong>${analysis.matchScore || 0}%</strong></div>
      </div>

      <div class="report-sections">
        <div class="report-block">
          <h3>Overview</h3>
          <p><strong>Analysis Date:</strong> ${formatDate(analysis.createdAt)}</p>
          <p><strong>Resume Name:</strong> ${currentResume.fileName || 'Not provided'}</p>
          <p><strong>Estimated ATS compatibility:</strong> ${analysis.atsScore || 0}/100</p>
          <p><strong>Job Match:</strong> ${analysis.matchScore || 0}%</p>
        </div>

        <div class="report-block">
          <h3>Detected Skills</h3>
          ${(analysis.matchedSkills || []).map((skill) => `<span class="skill-tag">${skill}</span>`).join('') || '<p class="muted-text">No matched skills were detected.</p>'}
        </div>

        <div class="report-block">
          <h3>Missing Skills</h3>
          ${(analysis.missingSkills || []).map((skill) => `<span class="skill-tag">${skill}</span>`).join('') || '<p class="muted-text">No critical missing skills identified.</p>'}
        </div>

        <div class="report-block">
          <h3>Resume Strengths</h3>
          <ul class="list">
            ${(analysis.strengths || []).map((strength) => `<li>${strength}</li>`).join('') || '<li>No major strengths detected based on the uploaded content.</li>'}
          </ul>
        </div>

        <div class="report-block">
          <h3>Resume Weaknesses</h3>
          <ul class="list">
            ${(analysis.weaknesses || []).map((weakness) => `<li>${weakness}</li>`).join('') || '<li>No obvious weaknesses noted.</li>'}
          </ul>
        </div>

        <div class="report-block">
          <h3>Keyword Analysis</h3>
          <p><strong>Found Keywords:</strong> ${(analysis.keywordAnalysis?.foundKeywords || []).join(', ') || 'None'}</p>
          <p><strong>Missing Keywords:</strong> ${(analysis.keywordAnalysis?.missingKeywords || []).join(', ') || 'None'}</p>
        </div>

        <div class="report-block">
          <h3>AI Recommendations</h3>
          <ul class="list">
            ${(analysis.recommendations || []).map((rec) => `<li>${rec}</li>`).join('') || '<li>No recommendations were generated.</li>'}
          </ul>
        </div>

        <div class="report-block">
          <h3>Role Match Summary</h3>
          ${(analysis.matchedSkills || []).slice(0, 8).map((skill) => `<span class="skill-tag">${skill}</span>`).join('') || '<p>No strong role match found.</p>'}
        </div>
      </div>
    `;

    document.getElementById('reportContent').innerHTML = resultHtml;
  } catch (error) {
    document.getElementById('reportContent').innerHTML = `<div class="empty-state">${error.message || 'Unable to load report.'}</div>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadReport();

  const downloadBtn = document.getElementById('downloadReportBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const content = document.getElementById('reportContent').innerText;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'resume-analysis-report.txt';
      anchor.click();
      URL.revokeObjectURL(url);
    });
  }

  const analyzeAgainBtn = document.getElementById('analyzeAgainBtn');
  if (analyzeAgainBtn) {
    analyzeAgainBtn.addEventListener('click', () => {
      window.location.href = '/dashboard';
    });
  }
});
