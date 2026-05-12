const API_BASE = '/api';
let posts = [];
let currentUser = { name: 'Joe Maina', avatar: 'JM' };
let isDarkMode = false;

async function init() {
  setupEventListeners();
  await loadAppData();

  // Events join buttons are re-rendered when events load, so use delegation.
  const eventsContainer = document.querySelector('[data-events-container]');
  if (eventsContainer && !eventsContainer.dataset.joinListenerAttached) {
    eventsContainer.dataset.joinListenerAttached = '1';
    eventsContainer.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-event-join]');
      if (!btn) return;

      const eventId = Number(btn.dataset.eventJoin);
      if (!eventId) return;

      try {
        await fetchJson(`${API_BASE}/events/${eventId}/join`, { method: 'POST' });
        await loadEvents();
      } catch (error) {
        console.error('Unable to join event', error);
      }
    });
  }
}


function setupEventListeners() {
  const createInput = document.getElementById('create-input');
  if (createInput) {
    createInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter' && this.value.trim()) {
        createPost(this.value.trim());
        this.value = '';
      }
    });
  }

  const darkModeBtn = document.getElementById('dark-mode-toggle');
  if (darkModeBtn) {
    darkModeBtn.addEventListener('click', toggleDarkMode);
  }

  const searchInput = document.querySelector('.topbar-search input');
  if (searchInput) {
    searchInput.addEventListener('input', function (e) {
      filterPosts(e.target.value);
    });
  }

  const createGroupForm = document.getElementById('create-group-form');
  if (createGroupForm) {
    createGroupForm.addEventListener('submit', handleCreateGroup);
  }

  const createEventForm = document.getElementById('create-event-form');
  if (createEventForm) {
    createEventForm.addEventListener('submit', handleCreateEvent);
  }

  const navLinks = document.querySelectorAll('.topbar-link');
  navLinks.forEach(link => {
    link.addEventListener('click', function () {
      navLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
    });
  });
}

function toggleDarkMode() {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle('dark-mode');

  // Persist preference so it stays correct after refresh.
  try {
    localStorage.setItem('linkhub_dark_mode', isDarkMode ? '1' : '0');
  } catch (_) {}

  const btn = document.getElementById('dark-mode-toggle');
  if (btn) {
    btn.textContent = isDarkMode ? '☀️' : '🌙';
  }
}


async function loadAppData() {
  await loadAuthState();
  await loadPosts();
  await loadProfile();
  await loadGroups();
  await loadEvents();
}


async function fetchJson(url, options = {}) {
  const fetchOptions = {
    ...options,
    credentials: 'include'
  };

  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}


async function loadAuthState() {
  const adminLink = document.querySelector('.topbar-right a[href$="admin.html"]');
  try {
    const result = await fetchJson(`${API_BASE}/auth/me`);
    if (result.user) {
      currentUser = result.user;
      updateAuthUI(result.user);
      const createInput = document.getElementById('create-input');
      if (createInput) {
        createInput.placeholder = `What's on your mind, ${currentUser.name}?`;
      }
      return;
    }
  } catch (error) {
    console.warn('Unable to determine auth state', error);
  }

  if (adminLink) {
    adminLink.style.display = 'none';
  }
}


function updateAuthUI(user) {
  const topbarRight = document.querySelector('.topbar-right');
  if (!topbarRight) return;

  const avatarEl = topbarRight.querySelector('.avatar-small');
  const nameEl = topbarRight.querySelector('span');

  if (avatarEl) avatarEl.textContent = user.avatar || avatarEl.textContent;
  if (nameEl) nameEl.textContent = user.name || nameEl.textContent;

  const signInLink = topbarRight.querySelector('a[href$="login.html"]');
  if (signInLink) signInLink.style.display = 'none';

  const adminLink = topbarRight.querySelector('a[href$="admin.html"]');
  if (adminLink) {
    adminLink.style.display = user.role === 'admin' ? 'inline-flex' : 'none';
  }

  // Normalize logout button presence and event wiring.
  let logoutBtn = topbarRight.querySelector('#logout-button');
  if (logoutBtn) {
    logoutBtn.style.display = 'inline-flex';
    logoutBtn.addEventListener('click', handleLogout);
    return;
  }

  logoutBtn = topbarRight.querySelector('.logout-btn');
  if (!logoutBtn) {
    logoutBtn = document.createElement('button');
    logoutBtn.type = 'button';
    logoutBtn.className = 'chip logout-btn';
    logoutBtn.style.cursor = 'pointer';
    logoutBtn.textContent = 'Sign Out';
    logoutBtn.addEventListener('click', handleLogout);
    topbarRight.appendChild(logoutBtn);
  }
}



async function handleLogout() {
  try {
    await fetchJson(`${API_BASE}/auth/logout`, { method: 'POST' });
    window.location.reload();
  } catch (error) {
    console.error('Unable to log out', error);
  }
}

async function loadPosts(query = '') {
  try {
    const url = query ? `${API_BASE}/posts?q=${encodeURIComponent(query)}` : `${API_BASE}/posts`;
    posts = await fetchJson(url);
    renderPosts(posts);
  } catch (error) {
    console.error('Unable to load posts', error);
  }
}

async function loadProfile() {
  const profileContainer = document.querySelector('[data-profile-container]');
  if (!profileContainer) return;

  try {
    const profile = await fetchJson(`${API_BASE}/profile/me`);
    currentUser = { name: profile.name, avatar: profile.avatar };

    profileContainer.innerHTML = `
      <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
        <div class="avatar-small" style="width: 80px; height: 80px; font-size: 2rem; background: var(--primary);">${profile.avatar}</div>
        <div>
          <h1 style="margin: 0; font-size: 2rem;">${profile.name}</h1>
          <p style="color: var(--muted); margin: 0;">${profile.headline} · ${profile.location}</p>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; margin-top: 1rem;">
        <div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1rem;">
          <div style="font-size: 0.85rem; color: var(--muted);">Friends</div>
          <div style="font-size: 1.5rem; font-weight: 600;">${profile.friends}</div>
        </div>
        <div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1rem;">
          <div style="font-size: 0.85rem; color: var(--muted);">Groups</div>
          <div style="font-size: 1.5rem; font-weight: 600;">${profile.groups}</div>
        </div>
        <div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1rem;">
          <div style="font-size: 0.85rem; color: var(--muted);">Events Attended</div>
          <div style="font-size: 1.5rem; font-weight: 600;">${profile.eventsAttended}</div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Unable to load profile', error);
  }
}

async function loadGroups() {
  const groupsContainer = document.querySelector('[data-groups-container]');
  if (!groupsContainer) return;

  try {
    const groups = await fetchJson(`${API_BASE}/groups`);
    groupsContainer.innerHTML = groups.map(group => `
      <div class="card" style="padding: 1rem;">
        <div style="font-size: 1rem; font-weight: 600; margin-bottom: 0.25rem;">${group.emoji} ${group.name}</div>
        <div style="color: var(--muted); margin-bottom: 0.75rem;">${group.members} members</div>
        <div style="font-size: 0.9rem;">${group.description}</div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Unable to load groups', error);
  }
}

const likedPostIds = new Set();

async function loadEvents() {
  const eventsContainer = document.querySelector('[data-events-container]');
  if (!eventsContainer) return;

  try {
    const events = await fetchJson(`${API_BASE}/events`);
    eventsContainer.innerHTML = events.map(event => {
      const dateStr = typeof event.date === 'string' ? event.date : '';
      const day = dateStr.length >= 10 ? dateStr.slice(8, 10) : '';
      const month = dateStr.length >= 7 ? dateStr.slice(5, 7) : '';

      return `
        <div class="card" style="padding: 1rem;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
            <div>
              <div style="font-size: 1rem; font-weight: 600;">${event.name}</div>
              <div style="color: var(--muted); font-size: 0.9rem;">${event.location} · ${event.date} · ${event.time}</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 1.4rem; font-weight: 700;">${day || ''}</div>
              <div style="font-size: 0.8rem; color: var(--muted);">${month || ''}</div>
            </div>
          </div>
          <p style="margin: 0 0 1rem;">${event.description}</p>
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span style="color: var(--muted);">${event.attending} attending</span>
            <button data-event-join="${event.id}" style="background: var(--primary); color: white; border: none; padding: 0.4rem 0.9rem; border-radius: 0.3rem; cursor: pointer;">Join</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Unable to load events', error);
  }
}


async function createPost(text) {
  try {
    const response = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error('Failed to create post');
    }

    await loadPosts();
  } catch (error) {
    console.error('Unable to create post', error);
  }
}


async function handleCreateGroup(event) {
  event.preventDefault();
  const form = event.target;
  const emoji = form.querySelector('[name="emoji"]').value.trim() || '👥';
  const name = form.querySelector('[name="name"]').value.trim();
  const members = Number(form.querySelector('[name="members"]').value) || 0;
  const description = form.querySelector('[name="description"]').value.trim();

  if (!name || !description) {
    return;
  }

  try {
    await createGroup({ emoji, name, members, description });
    form.reset();
  } catch (error) {
    console.error('Unable to create group', error);
  }
}

async function handleCreateEvent(event) {
  event.preventDefault();
  const form = event.target;
  const name = form.querySelector('[name="name"]').value.trim();
  const date = form.querySelector('[name="date"]').value;
  const time = form.querySelector('[name="time"]').value.trim();
  const location = form.querySelector('[name="location"]').value.trim();
  const attending = Number(form.querySelector('[name="attending"]').value) || 0;
  const description = form.querySelector('[name="description"]').value.trim();

  if (!name || !date || !location || !description) {
    return;
  }

  try {
    await createEvent({ name, date, time, location, attending, description });
    form.reset();
  } catch (error) {
    console.error('Unable to create event', error);
  }
}

async function createGroup(group) {
  const response = await fetch(`${API_BASE}/groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(group)
  });


  if (!response.ok) {
    throw new Error('Failed to create group');
  }

  await loadGroups();
}

async function createEvent(eventData) {
  const response = await fetch(`${API_BASE}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(eventData)
  });


  if (!response.ok) {
    throw new Error('Failed to create event');
  }

  await loadEvents();
}

async function toggleLike(postId) {
  try {
    const response = await fetch(`${API_BASE}/posts/${postId}/like`, { method: 'POST', credentials: 'include' });

    if (!response.ok) {
      throw new Error('Unable to like post');
    }

    likedPostIds.add(postId);

    const updatedPost = await response.json();
    const index = posts.findIndex(p => p.id === updatedPost.id);
    if (index !== -1) {
      posts[index] = updatedPost;
      updatePostDisplay(updatedPost.id);
    }
  } catch (error) {
    console.error(error);
  }
}


async function addComment(postId) {
  const input = document.querySelector(`[data-post-id="${postId}"] .comment-input`);
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  try {
    const response = await fetch(`${API_BASE}/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error('Unable to add comment');
    }

    await loadPosts();
  } catch (error) {
    console.error(error);
  }
}

function filterPosts(query) {
  if (query.trim()) {
    loadPosts(query.trim());
  } else {
    renderPosts(posts);
  }
}

function renderPosts(postList) {
  const feed = document.querySelector('.feed');
  if (!feed) return;

  feed.innerHTML = '';
  postList.forEach(post => feed.appendChild(createPostElement(post)));
}

function createPostElement(post) {
  const article = document.createElement('article');
  article.className = 'card post-card';
  article.setAttribute('data-post-id', post.id);

  const isLiked = likedPostIds.has(post.id);

  article.innerHTML = `
    <div class="post-header">
      <div class="avatar-small">${post.avatar}</div>
      <div>
        <div class="post-author">${post.author}</div>
        <div class="post-meta">${post.time} · ${post.location} · ${post.icon}</div>
      </div>
    </div>
    <p class="post-text">${post.text}</p>
    <div class="post-counts">
      <span><span class="like-count">${post.likes}</span> likes</span>
      <span>${post.comments.length} comments</span>
    </div>
    <div class="post-actions">
      <div class="post-action-btn like-btn ${isLiked ? 'liked' : ''}" onclick="toggleLike(${post.id})">
        ${isLiked ? '👍 Liked' : '👍 Like'}
      </div>
      <div class="post-action-btn" onclick="focusComment(${post.id})">💬 Comment</div>
      <div class="post-action-btn">↗ Share</div>
    </div>
    <div class="post-comments">
      ${post.comments
        .map(
          comment => `
            <div class="comment-row">
              <div class="avatar-small" style="width: 26px; height: 26px;">${comment.avatar}</div>
              <div class="comment-bubble">
                <div class="comment-author">${comment.author}</div>
                <div class="comment-text">${comment.text}</div>
              </div>
            </div>
          `
        )
        .join('')}
      <div class="comment-input-row">
        <div class="avatar-small" style="width: 26px; height: 26px;">${currentUser.avatar}</div>
        <input class="comment-input create-input" placeholder="Write a comment..." onkeypress="handleCommentKeypress(event, ${post.id})">
      </div>
    </div>
  `;

  return article;
}


function updatePostDisplay(postId) {
  const post = posts.find(p => p.id === postId);
  const card = document.querySelector(`[data-post-id="${postId}"]`);
  if (!post || !card) return;

  const likeCount = card.querySelector('.like-count');
  const likeBtn = card.querySelector('.like-btn');

  if (likeCount) likeCount.textContent = post.likes;

  const isLiked = likedPostIds.has(postId);
  if (likeBtn) {
    likeBtn.textContent = isLiked ? '👍 Liked' : '👍 Like';
    likeBtn.classList.toggle('liked', isLiked);
  }
}


function focusComment(postId) {
  const input = document.querySelector(`[data-post-id="${postId}"] .comment-input`);
  if (input) input.focus();
}

function handleCommentKeypress(event, postId) {
  if (event.key === 'Enter') {
    addComment(postId);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Apply persisted theme before init renders UI.
  try {
    const saved = localStorage.getItem('linkhub_dark_mode');
    if (saved === '1') {
      isDarkMode = true;
      document.body.classList.add('dark-mode');
    }
  } catch (_) {}
  init();
});
