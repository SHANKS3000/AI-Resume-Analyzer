document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  const token = getToken();

  if ((path === '/dashboard' || path === '/report') && !token) {
    window.location.href = '/login';
    return;
  }

  if ((path === '/login' || path === '/register') && token) {
    window.location.href = '/dashboard';
    return;
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearToken();
      window.location.href = '/login';
    });
  }

  const toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const style = document.createElement('style');
  style.textContent = `
      .toast-container { position: fixed; right: 24px; bottom: 24px; display: grid; gap: 10px; z-index: 999; }
      .toast { min-width: 220px; padding: 12px 14px; border-radius: 12px; color: white; font-weight: 600; box-shadow: 0 12px 28px rgba(0,0,0,0.12); }
      .toast-success { background: #10b981; }
      .toast-error { background: #ef4444; }
    `;
  document.head.appendChild(style);
});
