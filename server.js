require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs').promises;
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 4000;
const DATA_PATH = path.join(__dirname, 'data', 'store.json');
const MONGO_URI = process.env.MONGO_URI || '';
let dbConnected = false;

const profileSchema = new mongoose.Schema({
  name: String,
  avatar: String,
  location: String,
  headline: String,
  friends: Number,
  groups: Number,
  eventsAttended: Number
});

const commentSchema = new mongoose.Schema({
  author: String,
  avatar: String,
  text: String
}, { _id: false });

const postSchema = new mongoose.Schema({
  id: Number,
  author: String,
  avatar: String,
  time: String,
  location: String,
  icon: String,
  text: String,
  likes: Number,
  comments: [commentSchema]
});

const groupSchema = new mongoose.Schema({
  id: Number,
  name: String,
  emoji: String,
  members: Number,
  description: String
});

const eventSchema = new mongoose.Schema({
  id: Number,
  name: String,
  date: String,
  location: String,
  time: String,
  attending: Number,
  description: String
});

const userSchema = new mongoose.Schema({
  id: Number,
  name: String,
  email: String,
  avatar: String,
  role: { type: String, enum: ['admin', 'member'], default: 'member' },
  passwordHash: String
});

const Profile = mongoose.model('Profile', profileSchema);
const Post = mongoose.model('Post', postSchema);
const Group = mongoose.model('Group', groupSchema);
const Event = mongoose.model('Event', eventSchema);
const User = mongoose.model('User', userSchema);

app.use(cors());
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'linkhub-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
    sameSite: 'lax',
    secure: false
  }
}));
app.use(express.static(path.join(__dirname)));

async function connectDatabase() {
  if (!MONGO_URI) {
    console.warn('MONGO_URI not set. Falling back to JSON data store.');
    return;
  }

  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    dbConnected = true;
    console.log('Connected to MongoDB');
    await seedDatabase();
  } catch (error) {
    console.warn('MongoDB connection failed. Falling back to JSON data store.', error.message);
    dbConnected = false;
  }
}

async function readData() {
  const raw = await fs.readFile(DATA_PATH, 'utf8');
  return JSON.parse(raw);
}

async function writeData(data) {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
}

async function seedDatabase() {
  const data = await readData();
  const profileCount = await Profile.countDocuments();
  const postsCount = await Post.countDocuments();
  const groupsCount = await Group.countDocuments();
  const eventsCount = await Event.countDocuments();

  if (profileCount === 0) {
    await Profile.create(data.profile);
  }
  if (postsCount === 0) {
    await Post.insertMany(data.posts);
  }
  if (groupsCount === 0) {
    await Group.insertMany(data.groups);
  }
  if (eventsCount === 0) {
    await Event.insertMany(data.events);
  }

  const usersCount = await User.countDocuments();
  if (usersCount === 0 && Array.isArray(data.users)) {
    await User.insertMany(data.users);
  }
}

async function getPosts(query = '') {
  if (dbConnected) {
    const filter = query
      ? { $or: [
          { text: { $regex: query, $options: 'i' } },
          { author: { $regex: query, $options: 'i' } }
        ] }
      : {};
    return Post.find(filter).sort({ id: -1 }).lean();
  }
  const data = await readData();
  return data.posts.filter(post => {
    if (!query) return true;
    return post.text.toLowerCase().includes(query.toLowerCase()) ||
      post.author.toLowerCase().includes(query.toLowerCase());
  });
}

async function getProfile() {
  if (dbConnected) {
    return Profile.findOne().lean();
  }
  const data = await readData();
  return data.profile;
}

async function getUserByEmail(email) {
  if (dbConnected) {
    return User.findOne({ email: email.toLowerCase() }).lean();
  }
  const data = await readData();
  return (data.users || []).find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
}

async function getUsers() {
  if (dbConnected) {
    return User.find().lean();
  }
  const data = await readData();
  return data.users || [];
}

function getInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('') || 'LH';
}

async function createUser({ name, email, password, role = 'member' }) {
  const normalizedEmail = email.toLowerCase();
  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = {
    id: Date.now(),
    name,
    email: normalizedEmail,
    avatar: getInitials(name),
    role,
    passwordHash
  };

  if (dbConnected) {
    return User.create(newUser);
  }

  const data = await readData();
  data.users = data.users || [];
  data.users.push(newUser);
  await writeData(data);
  return newUser;
}

function ensureAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

function ensureAdmin(req, res, next) {
  if (!req.session || !req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

async function getGroups() {
  if (dbConnected) {
    return Group.find().lean();
  }
  const data = await readData();
  return data.groups;
}

async function getEvents() {
  if (dbConnected) {
    return Event.find().lean();
  }
  const data = await readData();
  return data.events;
}

app.get('/api/posts', async (req, res) => {
  try {
    const query = req.query.q || '';
    const posts = await getPosts(query);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Unable to load posts' });
  }
});

app.post('/api/posts', ensureAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Post text is required' });
    }

    const profile = await getProfile();
    const newPost = {
      id: Date.now(),
      author: profile.name,
      avatar: profile.avatar,
      time: 'Just now',
      location: 'LinkHub',
      icon: '🌍',
      text: text.trim(),
      likes: 0,
      comments: []
    };

    if (dbConnected) {
      const created = await Post.create(newPost);
      return res.status(201).json(created);
    }

    const data = await readData();
    data.posts.unshift(newPost);
    await writeData(data);
    res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({ error: 'Unable to create post' });
  }
});

app.post('/api/posts/:id/like', ensureAuth, async (req, res) => {
  try {
    const postId = Number(req.params.id);

    if (dbConnected) {
      const post = await Post.findOne({ id: postId });
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      post.likes += 1;
      await post.save();
      return res.json(post);
    }

    const data = await readData();
    const post = data.posts.find(p => p.id === postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    post.likes += 1;
    await writeData(data);
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Unable to like post' });
  }
});

app.post('/api/posts/:id/comments', ensureAuth, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const profile = await getProfile();
    const comment = {
      author: profile.name,
      avatar: profile.avatar,
      text: text.trim()
    };

    if (dbConnected) {
      const post = await Post.findOne({ id: postId });
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      post.comments.push(comment);
      await post.save();
      return res.json(post);
    }

    const data = await readData();
    const post = data.posts.find(p => p.id === postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    post.comments.push(comment);
    await writeData(data);
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Unable to add comment' });
  }
});

app.get('/api/groups', async (req, res) => {
  try {
    const groups = await getGroups();
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: 'Unable to load groups' });
  }
});

app.get('/api/events', async (req, res) => {
  try {
    const events = await getEvents();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Unable to load events' });
  }
});

app.post('/api/events/:id/join', ensureAuth, async (req, res) => {
  try {
    const eventId = Number(req.params.id);
    if (!eventId) {
      return res.status(400).json({ error: 'Invalid event id' });
    }

    if (dbConnected) {
      const event = await Event.findOne({ id: eventId });
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      event.attending = Number(event.attending) + 1;
      await event.save();
      return res.json(event);
    }

    const data = await readData();
    const event = (data.events || []).find(e => e.id === eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    event.attending = Number(event.attending) + 1;
    await writeData(data);
    return res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Unable to join event' });
  }
});


app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar
    };

    res.json({ user: req.session.user });
  } catch (error) {
    res.status(500).json({ error: 'Unable to authenticate' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'A user with that email already exists' });
    }

    const newUser = await createUser({ name, email, password });
    req.session.user = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      avatar: newUser.avatar
    };

    res.status(201).json({ user: req.session.user });
  } catch (error) {
    res.status(500).json({ error: 'Unable to create account' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Unable to log out' });
    }
    res.json({ success: true });
  });
});

app.get('/api/auth/me', (req, res) => {
  res.json({ user: req.session?.user || null });
});

app.get('/api/admin/stats', ensureAdmin, async (req, res) => {
  try {
    const groups = await getGroups();
    const events = await getEvents();
    const posts = await getPosts();
    const users = await getUsers();
    res.json({ groups: groups.length, events: events.length, posts: posts.length, users: users.length });
  } catch (error) {
    res.status(500).json({ error: 'Unable to load admin stats' });
  }
});

app.get('/api/admin/users', ensureAdmin, async (req, res) => {
  try {
    const users = await getUsers();
    res.json(users.map(user => ({ id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar })));
  } catch (error) {
    res.status(500).json({ error: 'Unable to load admin users' });
  }
});

app.post('/api/groups', ensureAuth, async (req, res) => {
  try {
    const { name, emoji, members = 0, description } = req.body;
    if (!name || !description) {
      return res.status(400).json({ error: 'Group name and description are required' });
    }

    const newGroup = {
      id: Date.now(),
      name,
      emoji: emoji || '👥',
      members: Number(members) || 0,
      description
    };

    if (dbConnected) {
      const created = await Group.create(newGroup);
      return res.status(201).json(created);
    }

    const data = await readData();
    data.groups.unshift(newGroup);
    await writeData(data);
    res.status(201).json(newGroup);
  } catch (error) {
    res.status(500).json({ error: 'Unable to create group' });
  }
});

app.post('/api/events', ensureAuth, async (req, res) => {
  try {
    const { name, date, location, time, attending = 0, description } = req.body;
    if (!name || !date || !location || !description) {
      return res.status(400).json({ error: 'Event name, date, location, and description are required' });
    }

    const newEvent = {
      id: Date.now(),
      name,
      date,
      location,
      time: time || 'TBA',
      attending: Number(attending) || 0,
      description
    };

    if (dbConnected) {
      const created = await Event.create(newEvent);
      return res.status(201).json(created);
    }

    const data = await readData();
    data.events.unshift(newEvent);
    await writeData(data);
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ error: 'Unable to create event' });
  }
});

app.get('/api/profile', async (req, res) => {
  try {
    const profile = await getProfile();
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Unable to load profile' });
  }
});

app.get('/api/profile/me', ensureAuth, async (req, res) => {
  try {
    const user = req.session.user;

    const seedProfile = await getProfile();

    // Deterministic per-user values (no DB migration required).
    // This makes different users see different headline/location/stats.
    const seed = Number(user.id) || 1;
    const rand = (n) => {
      const x = Math.sin(seed * 999 + n * 1337) * 10000;
      return x - Math.floor(x);
    };

    const locations = ['Nairobi, Kenya', 'Kampala, Uganda', 'Lagos, Nigeria', 'Accra, Ghana', 'Mombasa, Kenya'];
    const headlines = [
      'Product Designer · Community Advocate',
      'Full-Stack Developer · Open Source',
      'Data Enthusiast · Tech Educator',
      'Mobile Engineer · Startup Builder',
      'Backend Developer · DevOps Leaning'
    ];

    const profile = {
      ...(seedProfile || {}),
      name: user.name,
      avatar: user.avatar,
      location: locations[Math.floor(rand(1) * locations.length)] || 'Nairobi, Kenya',
      headline: headlines[Math.floor(rand(2) * headlines.length)] || 'Product Designer · Community Advocate',
      friends: 50 + Math.floor(rand(3) * 200),
      groups: 5 + Math.floor(rand(4) * 30),
      eventsAttended: 5 + Math.floor(rand(5) * 120)
    };

    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Unable to load profile' });
  }
});





connectDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`LinkHub backend running on http://localhost:${PORT}`);
  });
}).catch(error => {
  console.error('Server initialization failed:', error);
  app.listen(PORT, () => {
    console.log(`LinkHub backend running on http://localhost:${PORT} (fallback mode)`);
  });
});
