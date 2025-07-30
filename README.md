# AI-Powered Code Review Assistant

A comprehensive web application that provides intelligent code analysis, bug detection, and quality improvement suggestions for multiple programming languages. Built with modern technologies including AST parsing, static analysis tools, and GitHub API integration.

![AI Code Review Assistant](https://img.shields.io/badge/AI%20Code%20Review-Assistant-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node.js](https://img.shields.io/badge/Node.js-16%2B-brightgreen)
![React](https://img.shields.io/badge/React-18%2B-blue)

## 🚀 Features

### Core Functionality
- **Multi-Language Support**: JavaScript, TypeScript, Python, Java, Go, Rust, C++
- **AST Parsing**: Advanced Abstract Syntax Tree analysis for deep code understanding
- **Static Analysis**: Comprehensive code quality checks and pattern detection
- **Real-time Analysis**: Live code review with instant feedback

### Analysis Categories
- 🔒 **Security Analysis**: Detect vulnerabilities, injection risks, and security anti-patterns
- ⚡ **Performance Insights**: Identify bottlenecks, inefficient algorithms, and optimization opportunities
- 🐛 **Bug Detection**: Find potential bugs, unreachable code, and logical errors
- 🏗️ **Code Quality**: Complexity analysis, maintainability scores, and best practices
- 🎨 **Style Checking**: Code formatting and style consistency validation

### GitHub Integration
- **Repository Connection**: Seamless GitHub OAuth integration
- **Webhook Support**: Automatic analysis on push and pull requests
- **PR Comments**: Direct feedback on pull request changes
- **Commit Status**: Integration with GitHub commit status API

### User Experience
- **Modern UI**: Beautiful, responsive Material-UI design
- **Dark/Light Mode**: Automatic theme switching with user preferences
- **Real-time Updates**: Live analysis progress with WebSocket connections
- **Detailed Reports**: Comprehensive analysis results with actionable insights
- **Dashboard Analytics**: Statistics, trends, and repository overviews

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB** - Database for storing analysis results
- **Socket.IO** - Real-time communication
- **JWT** - Authentication and authorization

### Code Analysis
- **Esprima** - JavaScript/ES6 AST parser
- **@typescript-eslint/parser** - TypeScript AST parser
- **@babel/parser** - Modern JavaScript parsing
- **Acorn** - Lightweight JavaScript parser

### GitHub Integration
- **@octokit/rest** - GitHub API client
- **Webhooks** - Automated repository monitoring

### Frontend
- **React 18** - User interface library
- **Material-UI (MUI)** - React component library
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **Framer Motion** - Animation library
- **Monaco Editor** - Code editor component

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Jest** - Testing framework
- **Nodemon** - Development server

## 📦 Installation

### Prerequisites
- Node.js 16+ and npm 8+
- MongoDB 4.4+
- Git
- GitHub OAuth App (for GitHub integration)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/ai-code-review-assistant.git
cd ai-code-review-assistant
```

### 2. Install Dependencies
```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Configure the environment variables:
```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/code-review-assistant

# JWT Secret (generate a secure random string)
JWT_SECRET=your_super_secure_jwt_secret_key

# GitHub OAuth (create GitHub OAuth App)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_WEBHOOK_SECRET=your_webhook_secret

# Optional: OpenAI API for enhanced suggestions
OPENAI_API_KEY=your_openai_api_key
```

### 4. GitHub OAuth Setup
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App with:
   - **Application name**: AI Code Review Assistant
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:5000/api/auth/github/callback`
3. Copy the Client ID and Client Secret to your `.env` file

### 5. Start MongoDB
```bash
# Using Docker
docker run --name mongodb -d -p 27017:27017 mongo:latest

# Or start your local MongoDB service
sudo systemctl start mongod
```

### 6. Start the Application
```bash
# Development mode (runs both server and client)
npm run dev

# Or start them separately
npm run server:dev  # Backend only
npm run client:dev  # Frontend only
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api/health

## 🚀 Usage

### Getting Started
1. **Sign Up**: Create an account or login with GitHub
2. **Connect Repository**: Link your GitHub repositories
3. **Configure Analysis**: Set up analysis preferences and rules
4. **Run Analysis**: Trigger manual analysis or enable automatic webhook analysis
5. **Review Results**: Examine detailed reports and implement suggestions

### Analysis Configuration
Configure analysis rules for each repository:
- **Severity Levels**: Choose minimum severity (low, medium, high, critical)
- **Rule Categories**: Enable/disable specific analysis types
- **File Patterns**: Include/exclude specific paths or file types
- **Auto-Review**: Enable automatic analysis on commits and PRs

### Dashboard Features
- **Overview**: Repository statistics and analysis summaries
- **Recent Analyses**: History of code reviews and results
- **Issue Tracking**: Monitor and manage found issues
- **Trends**: Code quality trends over time

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run backend tests only
npm run test:server

# Run frontend tests only
npm run test:client

# Run tests with coverage
npm run test:coverage
```

### Test Structure
- **Unit Tests**: Individual component and function testing
- **Integration Tests**: API endpoint and database testing
- **E2E Tests**: Complete user workflow testing

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `GET /api/auth/github` - GitHub OAuth login

### Analysis Endpoints
- `GET /api/analysis` - List user analyses
- `POST /api/analysis` - Start new analysis
- `GET /api/analysis/:id` - Get analysis details
- `GET /api/analysis/:id/issues` - Get analysis issues

### Repository Endpoints
- `GET /api/repositories` - List connected repositories
- `POST /api/repositories` - Connect new repository
- `PUT /api/repositories/:id` - Update repository settings

### Webhook Endpoints
- `POST /api/webhooks/github` - GitHub webhook handler

## 🔧 Configuration

### Analysis Rules
Customize analysis behavior through configuration:

```javascript
// Repository analysis settings
{
  "rules": {
    "complexity": true,      // Cyclomatic complexity analysis
    "security": true,        // Security vulnerability detection
    "performance": true,     // Performance issue identification
    "style": false,          // Code style checking
    "bugs": true,           // Bug pattern detection
    "maintainability": true  // Maintainability assessment
  },
  "severity": "medium",      // Minimum severity level
  "excludePaths": [          // Paths to exclude from analysis
    "node_modules",
    "dist",
    "*.test.js"
  ]
}
```

### Supported Languages
| Language   | Extensions              | Parser           | Status |
|------------|-------------------------|------------------|--------|
| JavaScript | .js, .jsx, .mjs        | Esprima          | ✅     |
| TypeScript | .ts, .tsx              | TypeScript ESLint| ✅     |
| Python     | .py                    | Python AST       | ✅     |
| Java       | .java                  | Java Parser      | ✅     |
| Go         | .go                    | Go Parser        | 🚧     |
| Rust       | .rs                    | Rust Parser      | 🚧     |
| C++        | .cpp, .cc, .cxx, .hpp  | Clang Parser     | 🚧     |

## 🔒 Security

### Security Measures
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive input sanitization
- **CORS Configuration**: Proper cross-origin resource sharing
- **Helmet.js**: Security headers and protection
- **GitHub Webhook Verification**: Signed webhook validation

### Best Practices
- Keep dependencies updated
- Use environment variables for sensitive data
- Implement proper error handling
- Log security events
- Regular security audits

## 🚀 Deployment

### Production Deployment

#### Using Docker
```bash
# Build and run with Docker Compose
docker-compose up -d
```

#### Manual Deployment
```bash
# Build the client
cd client && npm run build && cd ..

# Start production server
NODE_ENV=production npm start
```

#### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://your-production-db
JWT_SECRET=your-production-jwt-secret
GITHUB_CLIENT_ID=your-production-github-client-id
GITHUB_CLIENT_SECRET=your-production-github-client-secret
```

### Deployment Platforms
- **Heroku**: Easy deployment with MongoDB Atlas
- **AWS**: Elastic Beanstalk or EC2 with RDS
- **DigitalOcean**: App Platform or Droplet
- **Vercel**: Frontend deployment with serverless functions

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Run the test suite (`npm test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Style
- Use ESLint and Prettier for code formatting
- Follow React and Node.js best practices
- Write meaningful commit messages
- Add JSDoc comments for functions
- Maintain test coverage above 80%

### Issue Reporting
When reporting issues, please include:
- Node.js and npm versions
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Error messages and stack traces

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Esprima**: JavaScript parsing library
- **Material-UI**: React component library
- **GitHub API**: Repository integration
- **MongoDB**: Database solution
- **OpenAI**: AI-powered suggestions (optional)

## 📞 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs and feature requests on GitHub Issues
- **Discussions**: Join community discussions on GitHub Discussions
- **Email**: support@ai-code-review.com (if available)

---

**Built with ❤️ for developers who care about code quality**