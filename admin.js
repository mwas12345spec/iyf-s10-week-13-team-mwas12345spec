const adminStatsElement = document.getElementById('admin-stats');
const adminUsersElement = document.getElementById('admin-users');

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || 'Request failed');
  }
  return response.json();
}

function updateAdminTopbar(user) {
  const topbarRight = document.querySelector('.topbar-right');
  if (!topbarRight) return;

  const avatarEl = topbarRight.querySelector('.avatar-small');
  const nameEl = topbarRight.querySelector('span');
  const loginLink = topbarRight.querySelector('a[href="login.html"]');

  if (avatarEl) avatarEl.textContent = user.avatar || avatarEl.textContent;
  if (nameEl) nameEl.textContent = user.name || nameEl.textContent;
  if (loginLink) loginLink.style.display = 'none';

  let logoutBtn = topbarRight.querySelector('#logout-button');
  if (logoutBtn) {
    logoutBtn.style.display = 'inline-flex';
    logoutBtn.addEventListener('click', async () => {
      try {
        await fetchJson('/api/auth/logout', { method: 'POST' });
        window.location.href = '../pages/login.html';
      } catch (error) {
        console.error('Unable to log out', error);
      }
    });
    return;
  }

  logoutBtn = topbarRight.querySelector('.logout-btn');
  if (!logoutBtn) {
    logoutBtn = document.createElement('button');
    logoutBtn.type = 'button';
    logoutBtn.className = 'chip logout-btn';
    logoutBtn.style.cursor = 'pointer';
    logoutBtn.textContent = 'Sign Out';
    logoutBtn.addEventListener('click', async () => {
      try {
        await fetchJson('/api/auth/logout', { method: 'POST' });
        window.location.href = '../pages/login.html';
      } catch (error) {
        console.error('Unable to log out', error);
      }
    });
    topbarRight.appendChild(logoutBtn);
  }
}

async function loadAdminAuth() {
  try {
    const result = await fetchJson('/api/auth/me');
    if (result.user) {
      updateAdminTopbar(result.user);
    }
  } catch (error) {
    console.warn('Unable to load admin auth state', error);
  }
}

async function loadAdminDashboard() {
  try {
    const stats = await fetchJson('/api/admin/stats');
    adminStatsElement.innerHTML = `
      <h3>Platform Activity</h3>
      <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem;">
        <div class="card" style="padding: 1rem; text-align: center;">
          <div style="font-size: 2rem; font-weight: 700;">${stats.posts}</div>
          <div>Posts</div>
        </div>
        <div class="card" style="padding: 1rem; text-align: center;">
          <div style="font-size: 2rem; font-weight: 700;">${stats.groups}</div>
          <div>Groups</div>
        </div>
        <div class="card" style="padding: 1rem; text-align: center;">
          <div style="font-size: 2rem; font-weight: 700;">${stats.events}</div>
          <div>Events</div>
        </div>
        <div class="card" style="padding: 1rem; text-align: center;">
          <div style="font-size: 2rem; font-weight: 700;">${stats.users}</div>
          <div>Users</div>
        </div>
      </div>
    `;

    const users = await fetchJson('/api/admin/users');
    adminUsersElement.innerHTML = `
      <h3>Registered Users</h3>
      <div style="display: grid; gap: 0.75rem;">
        ${users.map(user => `
          <div class="card" style="padding: 0.85rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem;">
            <div>
              <div style="font-weight: 700;">${user.name}</div>
              <div style="color: var(--muted); font-size: 0.9rem;">${user.email}</div>
            </div>
            <span style="font-weight: 600;">${user.role}</span>
          </div>
        `).join('')}
      </div>
    `;
  } catch (error) {
    adminStatsElement.innerHTML = `<h3>Admin Dashboard</h3><p style="color: var(--danger);">${error.message}</p>`;
    adminUsersElement.innerHTML = '';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadAdminAuth();
  await loadAdminDashboard();
});
