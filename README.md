

# LinkHub 🔗

A modern, full-stack community platform that connects members through posts, groups, events, and real-time interactions. LinkHub features a Facebook-style interface with secure authentication, user profiles, community groups, and an admin dashboard for platform management.

## About LinkHub

LinkHub is designed to foster meaningful connections within communities. Whether you're looking to share updates, organize events, create interest-based groups, or manage community content, LinkHub provides an intuitive and feature-rich platform. With built-in authentication, persistent data storage, and admin capabilities, LinkHub scales from small communities to larger networks.

## Key Features

### 📱 Community Engagement
- **Interactive Feed**: Create posts, like content, and engage with comments
- **Groups**: Create and join interest-based community groups
- **Events**: Discover, create, and attend community events
- **Real-time Search**: Find posts, users, groups, and events instantly

### 👤 User Management
- **Secure Authentication**: Login and session-based security with bcrypt password hashing
- **User Profiles**: View detailed user profiles, bio, and connections
- **Profile Customization**: Update your profile information and preferences

### 🛠️ Admin Dashboard
- **Platform Statistics**: Monitor user counts, posts, groups, and events
- **User Management**: View all registered users and manage community members
- **Content Moderation**: Access admin tools for platform management

### 🎨 User Experience
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Seamlessly works on desktop and mobile devices
- **Smooth Interactions**: Real-time updates without page refreshes

## Technology Stack

### Frontend
- **HTML5**: Semantic markup and structure
- **CSS3**: Modern styling with CSS Grid, Flexbox, and CSS custom properties
- **Vanilla JavaScript**: Interactive functionality with no framework dependencies
- **Responsive Design**: Mobile-first approach with media queries

### Backend
- **Node.js & Express**: Fast, scalable server framework
- **MongoDB (Optional)**: Primary database with Mongoose ORM
- **JSON Fallback**: Built-in JSON-based persistence when MongoDB unavailable
- **express-session**: Session-based authentication management
- **bcrypt**: Secure password hashing and verification
- **dotenv**: Environment configuration management

### Database
- **MongoDB** (Primary): Atlas cloud database with automatic sync
- **JSON Store** (Fallback): File-based persistence for offline or development use
- Data structure includes users, posts, groups, and events

## Project Structure

```
LinkHub/
├── index.html              # Main homepage with community feed
├── css/
│   └── styles.css          # Main stylesheet with dark mode support
├── js/
│   ├── app.js              # Main application logic (posts, groups, events, profile)
│   ├── login.js            # Authentication handling
│   └── admin.js            # Admin dashboard logic
├── pages/
│   ├── profile.html        # User profile page
│   ├── groups.html         # Groups listing and creation
│   ├── events.html         # Events calendar and details
│   ├── login.html          # Login/registration page
│   └── admin.html          # Admin dashboard
├── data/
│   └── store.json          # Local JSON data store (fallback database)
├── server.js               # Express backend server with API endpoints
├── package.json            # Node.js dependencies and metadata
├── .env                    # Environment variables (local)
├── .env.example            # Environment template
├── .gitignore              # Git ignore rules
└── README.md               # Project documentation
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Posts
- `GET /api/posts` - Fetch all posts
- `POST /api/posts` - Create a new post
- `POST /api/posts/:id/like` - Like a post
- `POST /api/posts/:id/comments` - Add a comment to a post

### Groups
- `GET /api/groups` - Fetch all groups
- `POST /api/groups` - Create a new group
- `POST /api/groups/:id/join` - Join a group

### Events
- `GET /api/events` - Fetch all events
- `POST /api/events` - Create a new event

### Profile
- `GET /api/profile` - Fetch public/seed profile data
- `GET /api/profile/me` - Fetch logged-in user profile (requires login/session)

### Admin
- `GET /api/admin/stats` - Get platform statistics
- `GET /api/admin/users` - Fetch all users

## Getting Started

### Prerequisites
- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)
- **MongoDB URI** (optional, for cloud database)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sleepyhallow254/Community-hub_group-5.git
   cd Community-hub_group-5
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Edit .env and add your configuration:
   # MONGODB_URI=your_mongodb_connection_string (optional)
   # SESSION_SECRET=your_session_secret
   # PORT=4000
   ```

4. **Start the server**
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

5. **Access the application**
   - Open your browser and navigate to `http://localhost:4000`
   - Create an account or login with demo credentials

### Default Demo Account
- **Email**: alice@linkhub.com
- **Password**: password123

## Usage

### Creating a Post
1. Navigate to the home feed
2. Click the "Create Post" button
3. Type your message and submit
4. Your post appears in the community feed

### Creating a Group
1. Go to the Groups page
2. Click "Create New Group"
3. Enter group details
4. Other members can join your group

### Creating an Event
1. Navigate to Events page
2. Click "Create Event"
3. Add event details (name, date, time, description)
4. Community members can view and attend

### Accessing Admin Dashboard
1. Login with an admin account
2. Navigate to Admin Dashboard
3. View platform statistics and user management options

## Development Features

### Session Management
- Secure session storage with `express-session`
- Optional MongoDB session persistence
- Automatic session cleanup

### Password Security
- Passwords hashed with bcrypt (10 salt rounds)
- Comparison with stored hash during login
- No plaintext password storage

### Database Flexibility
- MongoDB for production use
- JSON file fallback for development/offline scenarios
- Seamless switching between storage modes

### Error Handling
- Graceful fallback to JSON if MongoDB unavailable
- User-friendly error messages
- Comprehensive server-side logging

## Browser Support

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Future Enhancements

- Real-time notifications with WebSockets
- Direct messaging between users
- File and image upload capabilities
- Advanced search and filtering
- User recommendations and suggestions
- Activity feeds and social discovery
- Two-factor authentication
- Mobile app versions

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a pull request

## Troubleshooting

### Port Already in Use
```bash
# If port 4000 is already in use, you can either:
# 1. Kill the process using port 4000
# 2. Change PORT in .env to a different port (e.g., 5000)
```

### MongoDB Connection Issues
- Check that your MongoDB URI is correctly formatted
- Verify network access is allowed in MongoDB Atlas
- The app will automatically fallback to JSON storage if connection fails

### Session Not Persisting
- Ensure `SESSION_SECRET` is set in `.env`
- Clear browser cookies and try logging in again

## License

This project is open source and available under the [MIT License](LICENSE).

## Project Team

Built by the Community Hub Group 5 team for fostering better community connections.

---

**Built with ❤️ to connect communities**
