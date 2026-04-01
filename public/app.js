// ===== State =====
let currentView = 'dashboard';

// ===== DOM Elements =====
const views = {
  dashboard: document.getElementById('view-dashboard'),
  applications: document.getElementById('view-applications'),
  add: document.getElementById('view-add')
};

const navItems = document.querySelectorAll('.nav-item');
const pageTitle = document.getElementById('page-title');
const searchInput = document.getElementById('search-input');
const filterStatus = document.getElementById('filter-status');
const filterSort = document.getElementById('filter-sort');
const form = document.getElementById('application-form');
const modalOverlay = document.getElementById('modal-overlay');
const modalBody = document.getElementById('modal-body');
const modalTitle = document.getElementById('modal-title');
const modalClose = document.getElementById('modal-close');
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');

// ===== Navigation =====
function switchView(view) {
  currentView = view;

  // Update nav
  navItems.forEach(item => {
    item.classList.toggle('active', item.dataset.view === view);
  });

  // Update view visibility
  Object.entries(views).forEach(([key, el]) => {
    el.classList.toggle('active', key === view);
  });

  // Update title
  const titles = {
    dashboard: 'Dashboard',
    applications: 'All Applications',
    add: 'New Application'
  };
  pageTitle.textContent = titles[view];

  // Close mobile sidebar
  sidebar.classList.remove('open');

  // Load data for the view
  if (view === 'dashboard') loadDashboard();
  if (view === 'applications') loadApplications();
  if (view === 'add') {
    document.getElementById('application_date').valueAsDate = new Date();
  }
}

navItems.forEach(item => {
  item.addEventListener('click', () => switchView(item.dataset.view));
});

menuToggle.addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

// ===== API Helpers =====
async function apiGet(url) {
  const res = await fetch(url);
  return res.json();
}

async function apiPost(url, formData) {
  const res = await fetch(url, { method: 'POST', body: formData });
  return res.json();
}

async function apiPatch(url, data) {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

async function apiDelete(url) {
  const res = await fetch(url, { method: 'DELETE' });
  return res.json();
}

// ===== Toast =====
function showToast(message) {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  toastMessage.textContent = message;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 3000);
}

// ===== Dashboard =====
async function loadDashboard() {
  const stats = await apiGet('/api/stats');

  animateNumber('stat-total-num', stats.total);
  animateNumber('stat-applied-num', stats.applied);
  animateNumber('stat-interview-num', stats.interviewed);
  animateNumber('stat-offered-num', stats.offered);
  animateNumber('stat-rejected-num', stats.rejected);

  const applications = await apiGet('/api/applications?sort=newest');
  const recent = applications.slice(0, 5);
  renderApplicationsList('recent-applications', recent);
}

function animateNumber(elementId, target) {
  const el = document.getElementById(elementId);
  const current = parseInt(el.textContent) || 0;
  if (current === target) return;

  const duration = 600;
  const start = performance.now();

  function step(timestamp) {
    const progress = Math.min((timestamp - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(current + (target - current) * eased);
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

// ===== Applications List =====
async function loadApplications() {
  const status = filterStatus.value;
  const sort = filterSort.value;
  const search = searchInput.value;

  const params = new URLSearchParams();
  if (status !== 'all') params.set('status', status);
  if (sort) params.set('sort', sort);
  if (search) params.set('search', search);

  const applications = await apiGet(`/api/applications?${params}`);
  renderApplicationsList('all-applications', applications);
}

function renderApplicationsList(containerId, applications) {
  const container = document.getElementById(containerId);

  if (applications.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <h3>No applications yet</h3>
        <p>Start tracking your job applications by adding your first one.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = applications.map(app => {
    const initials = app.company_name.substring(0, 2);
    const date = new Date(app.application_date).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });

    const hasCv = app.cv_filename ? 'has-doc' : 'no-doc';
    const hasMl = app.motivation_letter_filename ? 'has-doc' : 'no-doc';

    return `
      <div class="app-card" data-status="${app.status}" onclick="openDetail('${app.id}')">
        <div class="app-card-icon">${initials}</div>
        <div class="app-card-info">
          <div class="app-card-title">${escapeHtml(app.job_title)}</div>
          <div class="app-card-company">${escapeHtml(app.company_name)}</div>
        </div>
        <div class="app-card-docs">
          <div class="doc-indicator ${hasCv}" title="${app.cv_filename ? 'CV uploaded' : 'No CV'}">CV</div>
          <div class="doc-indicator ${hasMl}" title="${app.motivation_letter_filename ? 'Letter uploaded' : 'No letter'}">ML</div>
        </div>
        <div class="app-card-meta">
          <span class="app-card-date">${date}</span>
          <span class="status-badge ${app.status}">${formatStatus(app.status)}</span>
        </div>
      </div>
    `;
  }).join('');
}

// ===== Form Handling =====
const cvUploadArea = document.getElementById('cv-upload-area');
const mlUploadArea = document.getElementById('ml-upload-area');
const cvFile = document.getElementById('cv-file');
const mlFile = document.getElementById('ml-file');

cvUploadArea.addEventListener('click', () => cvFile.click());
mlUploadArea.addEventListener('click', () => mlFile.click());

cvFile.addEventListener('change', () => handleFileSelect(cvFile, cvUploadArea, 'cv-upload-content'));
mlFile.addEventListener('change', () => handleFileSelect(mlFile, mlUploadArea, 'ml-upload-content'));

// Drag and drop
[cvUploadArea, mlUploadArea].forEach(area => {
  area.addEventListener('dragover', (e) => {
    e.preventDefault();
    area.style.borderColor = 'var(--accent-primary)';
    area.style.background = 'var(--accent-glow)';
  });

  area.addEventListener('dragleave', () => {
    area.style.borderColor = '';
    area.style.background = '';
  });

  area.addEventListener('drop', (e) => {
    e.preventDefault();
    area.style.borderColor = '';
    area.style.background = '';

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const isCV = area === cvUploadArea;
    const input = isCV ? cvFile : mlFile;
    const contentId = isCV ? 'cv-upload-content' : 'ml-upload-content';

    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    handleFileSelect(input, area, contentId);
  });
});

function handleFileSelect(input, area, contentId) {
  const content = document.getElementById(contentId);
  if (input.files.length > 0) {
    const file = input.files[0];
    area.classList.add('has-file');
    content.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
      <span class="upload-filename">${escapeHtml(file.name)}</span>
      <span class="upload-hint">${formatFileSize(file.size)}</span>
    `;
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const submitBtn = document.getElementById('submit-btn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
    Saving...
  `;

  const formData = new FormData(form);

  try {
    await apiPost('/api/applications', formData);
    showToast('✓ Application saved successfully!');
    resetForm();
    switchView('dashboard');
  } catch (err) {
    showToast('✗ Error saving application');
    console.error(err);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
        <polyline points="17 21 17 13 7 13 7 21"/>
        <polyline points="7 3 7 8 15 8"/>
      </svg>
      Save Application
    `;
  }
});

function resetForm() {
  form.reset();

  // Reset upload areas
  [
    { area: cvUploadArea, contentId: 'cv-upload-content', label: 'Upload CV' },
    { area: mlUploadArea, contentId: 'ml-upload-content', label: 'Upload Motivation Letter' }
  ].forEach(({ area, contentId, label }) => {
    area.classList.remove('has-file');
    document.getElementById(contentId).innerHTML = `
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="12" y1="18" x2="12" y2="12"/>
        <polyline points="9 15 12 12 15 15"/>
      </svg>
      <span class="upload-label">${label}</span>
      <span class="upload-hint">PDF, DOC, DOCX, TXT (max 10MB)</span>
    `;
  });
}

// ===== Detail Modal =====
async function openDetail(id) {
  const app = await apiGet(`/api/applications/${id}`);

  modalTitle.textContent = `${app.job_title} at ${app.company_name}`;

  const date = new Date(app.application_date).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  const interviewDate = app.interview_date
    ? new Date(app.interview_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Not scheduled';

  let docsHtml = '<div class="detail-docs">';
  if (app.cv_filename) {
    docsHtml += `
      <a href="/uploads/${app.cv_filename}" target="_blank" class="doc-link" download="${app.cv_original_name}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        CV: ${escapeHtml(app.cv_original_name)}
      </a>
    `;
  }
  if (app.motivation_letter_filename) {
    docsHtml += `
      <a href="/uploads/${app.motivation_letter_filename}" target="_blank" class="doc-link" download="${app.motivation_letter_original_name}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        Letter: ${escapeHtml(app.motivation_letter_original_name)}
      </a>
    `;
  }
  if (!app.cv_filename && !app.motivation_letter_filename) {
    docsHtml += '<span style="color: var(--text-muted); font-size: 0.85rem;">No documents uploaded</span>';
  }
  docsHtml += '</div>';

  modalBody.innerHTML = `
    <div class="detail-row">
      <div class="detail-section">
        <div class="detail-label">Company</div>
        <div class="detail-value">${escapeHtml(app.company_name)}</div>
      </div>
      <div class="detail-section">
        <div class="detail-label">Job Title</div>
        <div class="detail-value">${escapeHtml(app.job_title)}</div>
      </div>
    </div>

    <div class="detail-row">
      <div class="detail-section">
        <div class="detail-label">Applied On</div>
        <div class="detail-value">${date}</div>
      </div>
      <div class="detail-section">
        <div class="detail-label">Interview Date</div>
        <div class="detail-value">${interviewDate}</div>
      </div>
    </div>

    ${app.job_url ? `
    <div class="detail-section">
      <div class="detail-label">Job Posting</div>
      <div class="detail-value"><a href="${escapeHtml(app.job_url)}" target="_blank" style="color: var(--accent-primary-light);">${escapeHtml(app.job_url)}</a></div>
    </div>` : ''}

    ${app.job_description ? `
    <div class="detail-section">
      <div class="detail-label">Job Description</div>
      <div class="detail-value" style="max-height: 200px; overflow-y: auto; padding: 12px; background: var(--bg-input); border-radius: var(--radius-sm);">${escapeHtml(app.job_description)}</div>
    </div>` : ''}

    ${app.notes ? `
    <div class="detail-section">
      <div class="detail-label">Notes</div>
      <div class="detail-value">${escapeHtml(app.notes)}</div>
    </div>` : ''}

    <div class="detail-section">
      <div class="detail-label">Documents</div>
      ${docsHtml}
    </div>

    <div class="detail-actions">
      <div class="status-select-wrapper">
        <label style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 500;">Status:</label>
        <select class="status-select" id="detail-status" onchange="updateStatus('${app.id}', this.value)">
          <option value="applied" ${app.status === 'applied' ? 'selected' : ''}>Applied</option>
          <option value="interview" ${app.status === 'interview' ? 'selected' : ''}>Interview</option>
          <option value="offered" ${app.status === 'offered' ? 'selected' : ''}>Offered</option>
          <option value="rejected" ${app.status === 'rejected' ? 'selected' : ''}>Rejected</option>
          <option value="withdrawn" ${app.status === 'withdrawn' ? 'selected' : ''}>Withdrawn</option>
        </select>
      </div>

      <div style="display:flex; gap:8px; align-items:center; margin-left:auto;">
        <label style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 500;">Interview:</label>
        <input type="date" class="status-select" id="detail-interview-date" value="${app.interview_date || ''}" onchange="updateInterviewDate('${app.id}', this.value)">
      </div>

      <button class="btn btn-danger btn-sm" onclick="deleteApplication('${app.id}')" style="margin-left: 8px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
        Delete
      </button>
    </div>
  `;

  modalOverlay.classList.add('active');
}

async function updateStatus(id, status) {
  await apiPatch(`/api/applications/${id}`, { status });
  showToast(`Status updated to "${formatStatus(status)}"`);
  loadDashboard();
  loadApplications();
}

async function updateInterviewDate(id, date) {
  await apiPatch(`/api/applications/${id}`, { interview_date: date });
  showToast(date ? 'Interview date updated' : 'Interview date cleared');
}

async function deleteApplication(id) {
  if (!confirm('Are you sure you want to delete this application?')) return;

  await apiDelete(`/api/applications/${id}`);
  closeModal();
  showToast('Application deleted');
  loadDashboard();
  loadApplications();
}

function closeModal() {
  modalOverlay.classList.remove('active');
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ===== Filters & Search =====
filterStatus.addEventListener('change', loadApplications);
filterSort.addEventListener('change', loadApplications);

let searchTimer;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    if (currentView === 'applications') {
      loadApplications();
    } else if (currentView === 'dashboard') {
      // Switch to applications view on search
      switchView('applications');
    }
  }, 300);
});

// ===== Utilities =====
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatStatus(status) {
  const map = {
    applied: 'Applied',
    interview: 'Interview',
    offered: 'Offered',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn'
  };
  return map[status] || status;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ===== Spinning animation for loading =====
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .spin {
    animation: spin 1s linear infinite;
  }
`;
document.head.appendChild(style);

// ===== Init =====
loadDashboard();
