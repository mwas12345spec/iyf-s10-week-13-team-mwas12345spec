const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

async function handleLogin(event) {
  event.preventDefault();
  loginError.textContent = '';

  const email = loginForm.email.value.trim();
  const password = loginForm.password.value.trim();

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();
    if (!response.ok) {
      loginError.textContent = result.error || 'Login failed. Please try again.';
      return;
    }

    window.location.href = '../index.html';
  } catch (error) {
    loginError.textContent = 'Login failed. Please try again later.';
  }
}

async function checkAlreadyLoggedIn() {
  try {
    const response = await fetch('/api/auth/me');
    if (!response.ok) return;
    const result = await response.json();
    if (result.user) {
      window.location.href = '../index.html';
    }
  } catch (error) {
    console.warn('Unable to check authentication status', error);
  }
}

if (loginForm) {
  loginForm.addEventListener('submit', handleLogin);
}

document.addEventListener('DOMContentLoaded', checkAlreadyLoggedIn);
