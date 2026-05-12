const registerForm = document.getElementById('register-form');
const registerError = document.getElementById('register-error');

async function handleRegister(event) {
  event.preventDefault();
  registerError.textContent = '';

  const name = registerForm.name.value.trim();
  const email = registerForm.email.value.trim();
  const password = registerForm.password.value.trim();

  if (!name || !email || !password) {
    registerError.textContent = 'All fields are required.';
    return;
  }

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const result = await response.json();
    if (!response.ok) {
      registerError.textContent = result.error || 'Unable to create account.';
      return;
    }

    window.location.href = '../index.html';
  } catch (error) {
    registerError.textContent = 'Unable to create account. Please try again later.';
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

if (registerForm) {
  registerForm.addEventListener('submit', handleRegister);
}

document.addEventListener('DOMContentLoaded', checkAlreadyLoggedIn);
