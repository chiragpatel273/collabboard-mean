# CollabBoard - MEAN Stack Project Management Application

A modern, full-stack project management application built with the MEAN stack
(MongoDB, Express.js, Angular, Node.js). CollabBoard provides a comprehensive
Kanban-style task management system with real-time collaboration features.

## 🚀 Features

### 🔐 Authentication & Authorization

- User registration and login with JWT tokens
- Secure password hashing with bcrypt
- Token refresh mechanism
- Role-based access control (User/Admin)
- Protected routes with authentication guards
- Auto-logout functionality

### 📊 Project Management

- Create, edit, and delete projects
- Project ownership and member management
- Add/remove team members via email
- Project statistics and overview
- Search and filter projects
- Responsive project cards with metadata

### 📋 Task Management

- Kanban-style task board (Todo, In Progress, Done)
- Drag and drop task status updates
- Create tasks with:
  - Title and description
  - Priority levels (Low, Medium, High)
  - Due dates
  - Tags for categorization
  - Task assignment
- Task filtering and search
- Real-time task updates

### 🎨 User Interface

- Modern, responsive design
- Dark/Light theme support
- Intuitive navigation with sidebar
- Loading states and error handling
- Modal dialogs for task creation
- Drag-and-drop interactions
- Mobile-friendly responsive layout

### 📈 Dashboard & Analytics

- Personal dashboard with task overview
- Project statistics
- Recent activity tracking
- Task completion metrics
- Quick action shortcuts

## 🛠 Tech Stack

### Frontend (Angular 18+)

- **Framework**: Angular 18 with standalone components
- **UI**: Custom CSS with modern design patterns
- **State Management**: RxJS Observables and BehaviorSubjects
- **HTTP Client**: Angular HttpClient with interceptors
- **Forms**: Reactive Forms with validation
- **Routing**: Angular Router with lazy loading
- **Build Tool**: Angular CLI with Webpack

### Backend (Node.js/Express)

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js with async/await
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with refresh mechanism
- **Validation**: Custom middleware with Joi schemas
- **Security**: Helmet, CORS, rate limiting
- **Logging**: Winston for structured logging
- **Development**: ts-node-dev with hot reloading

### Database (MongoDB)

- **ODM**: Mongoose with TypeScript interfaces
- **Features**: Indexing, aggregation pipelines, pagination
- **Schema Design**: Normalized collections with references
- **Validation**: Schema-level validation with custom validators

## 📁 Project Structure

```
collabboard-mean/
├── packages/
│   ├── client/                 # Angular frontend application
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── components/     # Angular components
│   │   │   │   │   ├── auth/           # Authentication components
│   │   │   │   │   ├── dashboard/      # Dashboard components
│   │   │   │   │   ├── layout/         # Layout components (header, sidebar)
│   │   │   │   │   ├── projects/       # Project management components
│   │   │   │   │   └── tasks/          # Task management components
│   │   │   │   ├── guards/         # Route guards
│   │   │   │   ├── interceptors/   # HTTP interceptors
│   │   │   │   ├── models/         # TypeScript interfaces
│   │   │   │   └── services/       # Angular services
│   │   │   ├── assets/         # Static assets
│   │   │   └── styles/         # Global styles
│   │   ├── package.json
│   │   └── angular.json
│   └── server/                 # Node.js backend application
│       ├── src/
│       │   ├── controllers/    # Route handlers
│       │   ├── middleware/     # Custom middleware
│       │   ├── models/         # Mongoose models
│       │   ├── repositories/   # Data access layer
│       │   ├── routes/         # API routes
│       │   ├── schemas/        # Validation schemas
│       │   ├── services/       # Business logic
│       │   └── index.ts        # Application entry point
│       ├── package.json
│       └── tsconfig.json
├── .vscode/                    # VS Code configuration
├── package.json                # Root package.json with workspace scripts
└── README.md                   # Project documentation
```

## 🚦 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **MongoDB** >= 6.x (local or cloud)
- **Git** for version control

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd collabboard-mean
   ```

2. **Install dependencies**

   ```bash
   npm run install:all
   ```

   This will install dependencies for both client and server.

3. **Environment Configuration** Create `.env` file in `packages/server/`:

   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/collabboard

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key
   JWT_REFRESH_SECRET=your-refresh-secret-key
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d

   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # CORS
   FRONTEND_URL=http://localhost:4200
   ```

4. **Start MongoDB**
   - Local MongoDB: `mongod`
   - Or use MongoDB Atlas (cloud)

### Development

1. **Start both client and server in development mode:**

   ```bash
   npm run dev
   ```

   This starts:
   - Backend server on `http://localhost:5000`
   - Frontend client on `http://localhost:4200`

2. **Start services individually:**

   ```bash
   # Backend only
   npm run server:dev

   # Frontend only
   npm run client:start
   ```

### Production Build

1. **Build the application:**

   ```bash
   npm run build
   ```

2. **Start production server:**
   ```bash
   npm start
   ```

## 🔧 Development Tools

### Debugging

- **VS Code Debug Configurations**: Pre-configured launch.json for server
  debugging
- **Debug Scripts**: `npm run debug` in server package
- **Browser DevTools**: Angular DevTools support

### Code Quality

- **Prettier**: Code formatting
- **ESLint**: Linting for TypeScript
- **TypeScript**: Strong typing throughout
- **Git Hooks**: Pre-commit formatting

### Hot Reloading

- **Server**: ts-node-dev with automatic restart
- **Client**: Angular CLI dev server with live reload

## 📚 API Documentation

### Authentication Endpoints

```
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
POST /api/auth/logout       # User logout
POST /api/auth/refresh      # Token refresh
GET  /api/auth/me          # Get current user profile
```

### Project Endpoints

```
GET    /api/projects           # Get user's projects
POST   /api/projects           # Create new project
GET    /api/projects/:id       # Get project by ID
PUT    /api/projects/:id       # Update project
DELETE /api/projects/:id       # Delete project
POST   /api/projects/:id/members    # Add member
DELETE /api/projects/:id/members/:memberId  # Remove member
```

### Task Endpoints

```
GET    /api/tasks/projects/:projectId/tasks  # Get project tasks
POST   /api/tasks/projects/:projectId/tasks  # Create task
GET    /api/tasks/:id                        # Get task by ID
PUT    /api/tasks/:id                        # Update task
DELETE /api/tasks/:id                        # Delete task
PATCH  /api/tasks/:id/status                 # Update task status
```

### Dashboard Endpoints

```
GET /api/tasks/dashboard          # User dashboard data
GET /api/projects/:id/stats       # Project statistics
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **CORS Protection**: Configured for frontend domain
- **Rate Limiting**: API rate limiting middleware
- **Helmet Security**: Security headers
- **Input Validation**: Joi schema validation
- **SQL Injection Protection**: MongoDB NoSQL injection prevention

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run server tests
cd packages/server && npm test

# Run client tests
cd packages/client && npm test
```

## 🚀 Deployment

### Docker (Future Enhancement)

- Multi-stage Docker builds
- Docker Compose for development
- Production-ready containers

### Cloud Deployment Options

- **Heroku**: Easy deployment with MongoDB Atlas
- **AWS**: EC2 instances with RDS
- **Digital Ocean**: Droplets with managed databases
- **Vercel/Netlify**: Frontend deployment with serverless backend

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.

## 🐛 Known Issues

- [ ] Real-time updates require WebSocket implementation
- [ ] File upload functionality for task attachments
- [ ] Email notifications for task assignments
- [ ] Advanced filtering and search capabilities

## 🎯 Future Enhancements

- [ ] Real-time collaboration with Socket.io
- [ ] File attachments for tasks
- [ ] Email notifications
- [ ] Advanced reporting and analytics
- [ ] Team chat integration
- [ ] Mobile app (React Native/Flutter)
- [ ] Calendar integration
- [ ] Time tracking functionality

## 📞 Support

For support and questions:

- Create an issue on GitHub
- Email: your-email@example.com

## 🙏 Acknowledgments

- Angular Team for the amazing framework
- Express.js community for robust backend tools
- MongoDB team for the flexible database
- All contributors and testers

---

**Built with ❤️ using the MEAN Stack**
