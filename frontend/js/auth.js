document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;

      try {
        const data = await apiRequest('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });

        setToken(data.token);
        showToast('Login successful.');
        window.location.href = '/dashboard';
      } catch (error) {
        showToast(error.message || 'Login failed.', 'error');
      }
    });
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const name = document.getElementById('registerName').value.trim();
      const email = document.getElementById('registerEmail').value.trim();
      const password = document.getElementById('registerPassword').value;
      const confirmPassword = document.getElementById('registerConfirmPassword').value;

      try {
        const data = await apiRequest('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password, confirmPassword }),
        });

        setToken(data.token);
        showToast('Account created successfully.');
        window.location.href = '/dashboard';
      } catch (error) {
        showToast(error.message || 'Registration failed.', 'error');
      }
    });
  }
});
