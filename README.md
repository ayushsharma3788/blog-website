# BlogHub - Modern Blog Platform

A full-stack blog website built with Node.js, Express, MongoDB, and vanilla JavaScript. Features user authentication, CRUD operations for blog posts, likes, comments, and a modern responsive UI.

## Features

### 🔐 Authentication
- User registration and login
- JWT token-based authentication
- Profile management with avatar and bio
- Secure password hashing with bcrypt

### 📝 Blog Posts
- Create, read, update, and delete blog posts
- Rich text content with markdown support
- Featured images and tags
- Draft and published post status
- Read time estimation
- Search and filter functionality

### ❤️ Social Features
- Like/unlike posts and comments
- Comment system with nested replies
- User profiles with post history
- Real-time like counts

### 🎨 Modern UI/UX
- Responsive design for all devices
- Modern gradient hero section
- Smooth animations and transitions
- Toast notifications
- Loading states
- Beautiful card-based layout

### 🔍 Advanced Features
- Pagination for posts
- Search functionality
- Tag filtering
- User post management
- Admin capabilities

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **cors** - Cross-origin resource sharing

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS Grid and Flexbox
- **Vanilla JavaScript** - No framework dependencies
- **Font Awesome** - Icons
- **Google Fonts** - Typography

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd blog-website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/blog-website
   JWT_SECRET=your-super-secret-jwt-key
   ```

4. **Start MongoDB**
   - If using local MongoDB:
     ```bash
     mongod
     ```
   - Or use MongoDB Atlas (cloud service)

5. **Run the application**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
blog-website/
├── models/                 # Database models
│   ├── User.js           # User model
│   ├── Post.js           # Post model
│   └── Comment.js        # Comment model
├── routes/                # API routes
│   ├── auth.js           # Authentication routes
│   ├── posts.js          # Post CRUD routes
│   └── comments.js       # Comment routes
├── middleware/            # Middleware functions
│   └── auth.js           # Authentication middleware
├── public/               # Frontend files
│   ├── index.html        # Main HTML file
│   ├── styles.css        # CSS styles
│   └── app.js           # JavaScript functionality
├── server.js             # Express server setup
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Posts
- `GET /api/posts` - Get all posts (with pagination, search, filters)
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like/unlike post
- `GET /api/posts/user/:userId` - Get user's posts

### Comments
- `GET /api/comments/post/:postId` - Get comments for a post
- `POST /api/comments` - Add comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment
- `POST /api/comments/:id/like` - Like/unlike comment
- `GET /api/comments/:id/replies` - Get comment replies

## Usage Guide

### For Users

1. **Registration/Login**
   - Click "Register" or "Login" in the navigation
   - Fill in your details and create an account
   - You'll be automatically logged in

2. **Creating Posts**
   - Click "New Post" in the user menu
   - Fill in the title, content, tags, and optional featured image
   - Click "Publish Post" to make it public

3. **Interacting with Posts**
   - Like posts by clicking the heart icon
   - Add comments at the bottom of any post
   - Reply to existing comments
   - Edit or delete your own comments

4. **Managing Your Profile**
   - Click your username in the navigation
   - Select "Profile" to view your posts
   - Click "Edit Profile" to update your information

### For Developers

1. **Adding New Features**
   - Backend: Add routes in the `routes/` directory
   - Frontend: Add JavaScript functions in `public/app.js`
   - Styling: Add CSS in `public/styles.css`

2. **Database Modifications**
   - Update models in the `models/` directory
   - Run database migrations if needed

3. **Deployment**
   - Set up environment variables
   - Configure MongoDB connection
   - Deploy to your preferred hosting service

## Customization

### Styling
The application uses CSS custom properties for easy theming. Modify the variables in `public/styles.css`:

```css
:root {
    --primary-color: #3b82f6;
    --primary-hover: #2563eb;
    /* Add more custom properties */
}
```

### Features
- Add new post categories
- Implement user roles and permissions
- Add image upload functionality
- Integrate with social media platforms
- Add email notifications

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- CORS protection
- XSS prevention
- CSRF protection (can be added)

## Performance Optimizations

- Database indexing on frequently queried fields
- Pagination for large datasets
- Image optimization
- Caching strategies (can be implemented)
- CDN integration for static assets

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code comments

## Future Enhancements

- [ ] Real-time notifications
- [ ] Email verification
- [ ] Password reset functionality
- [ ] Social media login
- [ ] Advanced search with filters
- [ ] Post categories and tags
- [ ] Image upload and management
- [ ] Rich text editor
- [ ] Mobile app version
- [ ] API rate limiting
- [ ] Caching layer
- [ ] Analytics dashboard 