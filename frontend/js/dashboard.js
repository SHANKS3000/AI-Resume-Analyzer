const formatDate = (dateString) => new Date(dateString).toLocaleDateString();
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

const renderUserBadge = (user) => {
  const userBadge = document.getElementById('userBadge');
  if (!userBadge) return;
  userBadge.textContent = user ? `${user.name}` : 'User';
};

const renderProfileInfo = (user) => {
  const profileInfo = document.getElementById('profileInfo');
  if (!profileInfo) return;
  const displayName = user.name || 'User';
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();

  profileInfo.innerHTML = `
    <div class="profile-card">
      <div class="profile-identity">
        <div class="profile-avatar" aria-hidden="true">${escapeHtml(initials || 'U')}</div>
        <div class="profile-copy">
          <p class="profile-kicker">Account profile</p>
          <h3>${escapeHtml(displayName)}</h3>
          <p class="profile-email">${escapeHtml(user.email || 'No email available')}</p>
        </div>
      </div>
      <div class="profile-details">
        <div class="profile-detail">
          <span>Account status</span>
          <strong><span class="status-dot" aria-hidden="true"></span>Active</strong>
        </div>
        <div class="profile-detail">
          <span>Member since</span>
          <strong>${escapeHtml(formatDate(user.createdAt))}</strong>
        </div>
      </div>
    </div>
  `;
};

const renderStats = (resumes, analyses) => {
  const resumeCount = resumes.length;
  const analysisCount = analyses.length;
  const avgAts = analyses.length
    ? Math.round(analyses.reduce((sum, item) => sum + Number(item.atsScore || 0), 0) / analyses.length)
    : 0;
  const bestMatch = analyses.length
    ? Math.max(...analyses.map((item) => Number(item.matchScore || 0)))
    : 0;

  document.getElementById('totalResumes').textContent = resumeCount;
  document.getElementById('totalAnalyses').textContent = analysisCount;
  document.getElementById('avgAts').textContent = `${avgAts}/100`;
  document.getElementById('bestMatch').textContent = `${bestMatch}%`;
};

const renderRecentAnalysis = (analyses) => {
  const container = document.getElementById('recentAnalysis');
  if (!container) return;

  if (!analyses.length) {
    container.innerHTML = '<div class="empty-state">No analysis yet. Upload a resume to begin.</div>';
    return;
  }

  container.innerHTML = analyses
    .slice(0, 4)
    .map(
      (item) => `
        <div class="analysis-item">
          <div>
            <strong>${item.targetRole || 'Target Role'}</strong>
            <span class="muted-text">${formatDate(item.createdAt)}</span>
          </div>
          <div><span class="muted-text">ATS</span><br/><span class="mini-pill">${item.atsScore || 0}/100</span></div>
          <div><span class="muted-text">Match</span><br/><span class="mini-pill">${item.matchScore || 0}%</span></div>
          <div><span class="muted-text">Skills</span><br/><span>${(item.matchedSkills || []).length}</span></div>
          <a class="btn btn-secondary" href="/report?id=${item._id}">View Report</a>
        </div>
      `
    )
    .join('');
};

const renderSkillChart = (analyses) => {
  const canvas = document.getElementById('skillsChart');
  if (!canvas) return;

  const labels = [];
  const counts = [];

  analyses.forEach((analysis) => {
    (analysis.matchedSkills || []).forEach((skill) => {
      const key = skill.toLowerCase();
      const index = labels.indexOf(skill);
      if (index >= 0) {
        counts[index] += 1;
      } else {
        labels.push(skill);
        counts.push(1);
      }
    });
  });

  if (window.skillsChartInstance) {
    window.skillsChartInstance.destroy();
  }

  window.skillsChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels.slice(0, 8),
      datasets: [{
        label: 'Detected skills',
        data: counts.slice(0, 8),
        backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#14b8a6', '#6366f1', '#f97316'],
        borderRadius: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: { y: { beginAtZero: true } },
    },
  });
};

const renderHistory = (analyses) => {
  const historyTable = document.getElementById('historyTable');
  if (!historyTable) return;

  if (!analyses.length) {
    historyTable.innerHTML = '<div class="empty-state">No saved analyses yet.</div>';
    return;
  }

  historyTable.innerHTML = analyses
    .map(
      (item) => `
        <div class="history-row">
          <div><strong>${item.targetRole}</strong><div class="muted-text">${formatDate(item.createdAt)}</div></div>
          <div>${item.atsScore || 0}/100</div>
          <div>${item.matchScore || 0}%</div>
          <div>${(item.matchedSkills || []).length}</div>
          <div>${item.missingSkills?.length || 0}</div>
          <div class="history-actions">
            <a class="inline-btn primary" href="/report?id=${item._id}">View</a>
            <button class="inline-btn" type="button" data-delete-id="${item._id}">Delete</button>
          </div>
        </div>
      `
    )
    .join('');

  historyTable.querySelectorAll('[data-delete-id]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.dataset.deleteId;
      try {
        await apiRequest(`/api/analysis/${id}`, { method: 'DELETE' });
        showToast('Analysis deleted.');
        loadDashboard();
      } catch (error) {
        showToast(error.message || 'Unable to delete analysis.', 'error');
      }
    });
  });
};

async function loadDashboard() {
  try {
    const userRes = await apiRequest('/api/auth/me');
    renderUserBadge(userRes.user);
    renderProfileInfo(userRes.user);

    const [resumeRes, analysisRes] = await Promise.all([
      apiRequest('/api/resumes'),
      apiRequest('/api/analysis'),
    ]);

    renderStats(resumeRes.resumes || [], analysisRes.analyses || []);
    renderRecentAnalysis(analysisRes.analyses || []);
    renderSkillChart(analysisRes.analyses || []);
    renderHistory(analysisRes.analyses || []);
  } catch (error) {
    console.error(error);
    showToast(error.message || 'Unable to load dashboard.', 'error');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const token = getToken();
  if (!token) {
    window.location.href = '/login';
    return;
  }

  loadDashboard();

  const resumeInput = document.getElementById('resumeInput');
  const selectFileBtn = document.getElementById('selectFileBtn');
  const uploadBox = document.getElementById('uploadBox');
  const selectedFileInfo = document.getElementById('selectedFileInfo');
  const resumeUploadForm = document.getElementById('resumeUploadForm');

  selectFileBtn?.addEventListener('click', () => resumeInput.click());
  uploadBox?.addEventListener('click', () => resumeInput.click());

  resumeInput?.addEventListener('change', () => {
    const file = resumeInput.files[0];
    if (!file) return;
    selectedFileInfo.classList.remove('hidden');
    selectedFileInfo.innerHTML = `File: ${file.name} <br> Size: ${(file.size / 1024 / 1024).toFixed(2)} MB <br> Type: ${file.type || 'Unknown'}`;
  });

  resumeUploadForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const file = resumeInput.files[0];
    if (!file) {
      showToast('Please choose a PDF or DOCX resume file first.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('targetRole', document.getElementById('targetRole').value);

    try {
      const uploadResult = await apiRequest('/api/resumes/upload', {
        method: 'POST',
        body: formData,
      });

      const previewBox = document.getElementById('extractedTextPreview');
      const previewText = document.getElementById('resumePreviewText');
      previewBox.classList.remove('hidden');
      previewText.textContent = uploadResult.resume.extractedText.slice(0, 2500) || 'No text extracted yet.';

      const analysisResult = await apiRequest('/api/analysis', {
        method: 'POST',
        body: JSON.stringify({
          resumeId: uploadResult.resume._id,
          targetRole: document.getElementById('targetRole').value,
          jobDescription: document.getElementById('jobDescription').value,
        }),
      });

      showToast('Resume analyzed successfully.');
      window.location.href = `/report?id=${analysisResult.analysis._id}`;
    } catch (error) {
      showToast(error.message || 'Unable to analyze resume.', 'error');
    }
  });
});
