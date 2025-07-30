# Contributing to AI Code Review Assistant

We love your input! We want to make contributing to AI Code Review Assistant as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## 🚀 Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

### 1. Fork the Repository

Fork the repository and create your branch from `main`:

```bash
git clone https://github.com/your-username/ai-code-review-assistant.git
cd ai-code-review-assistant
git checkout -b feature/amazing-feature
```

### 2. Set Up Development Environment

Follow the installation instructions in the [README.md](README.md) to set up your local development environment.

```bash
# Install dependencies
npm install
cd client && npm install && cd ..

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development servers
npm run dev
```

### 3. Make Your Changes

- Write clean, readable code
- Follow the existing code style
- Add tests for new functionality
- Update documentation as needed

### 4. Test Your Changes

```bash
# Run all tests
npm test

# Run linting
npm run lint

# Type checking (if applicable)
npm run type-check
```

### 5. Commit Your Changes

We follow the [Conventional Commits](https://conventionalcommits.org/) specification:

```bash
git commit -m "feat: add support for Rust language analysis"
git commit -m "fix: resolve memory leak in AST parsing"
git commit -m "docs: update API documentation"
```

### 6. Submit a Pull Request

Push your branch and create a pull request:

```bash
git push origin feature/amazing-feature
```

## 📝 Pull Request Guidelines

### Before Submitting

- [ ] Code follows the project's style guidelines
- [ ] Self-review of your own code
- [ ] Tests added for new functionality
- [ ] Tests pass locally
- [ ] Documentation updated if needed
- [ ] No new warnings or errors introduced

### Pull Request Template

When creating a pull request, please include:

**Description**
A clear description of what this PR does and why.

**Type of Change**
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

**Testing**
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

**Screenshots** (if applicable)
Add screenshots to help explain your changes.

## 🐛 Bug Reports

We use GitHub Issues to track public bugs. Report a bug by opening a new issue.

### Great Bug Reports Include:

- **Quick summary**: One-line summary of the issue
- **Steps to reproduce**: Be specific! Include sample code if possible
- **Expected behavior**: What you expected to happen
- **Actual behavior**: What actually happened
- **Environment**: OS, Node.js version, browser, etc.
- **Additional context**: Screenshots, logs, etc.

### Bug Report Template

```markdown
**Summary**
Brief description of the issue

**Steps to Reproduce**
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
A clear description of what you expected to happen.

**Actual Behavior**
A clear description of what actually happened.

**Environment**
- OS: [e.g. macOS 12.0]
- Node.js: [e.g. 18.15.0]
- Browser: [e.g. Chrome 108]
- Version: [e.g. 1.0.0]

**Additional Context**
Add any other context, logs, or screenshots about the problem.
```

## 💡 Feature Requests

We welcome feature requests! Please open an issue with:

- **Problem**: What problem does this solve?
- **Solution**: Your proposed solution
- **Alternatives**: Alternative solutions considered
- **Additional context**: Mockups, examples, etc.

## 🎨 Code Style Guidelines

### JavaScript/TypeScript

- Use ES6+ features
- Prefer `const` over `let` over `var`
- Use meaningful variable names
- Add JSDoc comments for functions
- Follow Airbnb style guide (enforced by ESLint)

```javascript
/**
 * Analyzes code for security vulnerabilities
 * @param {string} code - The source code to analyze
 * @param {string} language - Programming language
 * @returns {Promise<Array>} Array of security issues
 */
const analyzeSecurityIssues = async (code, language) => {
  // Implementation
};
```

### React Components

- Use functional components with hooks
- Use TypeScript for props (when applicable)
- Follow the component file structure:

```jsx
import React from 'react';
import { ComponentProps } from './types';
import styles from './Component.module.css';

const Component = ({ prop1, prop2 }) => {
  // Hooks
  // Event handlers
  // Render logic
  
  return (
    <div className={styles.container}>
      {/* Component JSX */}
    </div>
  );
};

export default Component;
```

### CSS/Styling

- Use Material-UI components when possible
- Follow BEM methodology for custom CSS
- Use CSS modules for component-specific styles
- Responsive design first approach

## 🧪 Testing Guidelines

### Unit Tests

- Test individual functions and components
- Mock external dependencies
- Use descriptive test names
- Aim for 80%+ code coverage

```javascript
describe('AnalysisEngine', () => {
  describe('analyzeComplexity', () => {
    it('should detect high complexity in nested loops', () => {
      const code = `
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            // nested logic
          }
        }
      `;
      
      const result = analyzeComplexity(code);
      expect(result.complexity).toBeGreaterThan(10);
    });
  });
});
```

### Integration Tests

- Test API endpoints
- Test database operations
- Test component interactions

### E2E Tests

- Test complete user workflows
- Test critical paths
- Use Cypress or similar tools

## 📚 Documentation Guidelines

### Code Documentation

- Add JSDoc comments for all public functions
- Include parameter types and return types
- Provide usage examples

### README Updates

- Keep installation instructions current
- Update feature lists when adding functionality
- Include screenshots for UI changes

### API Documentation

- Document all endpoints
- Include request/response examples
- Update OpenAPI/Swagger specs

## 🔒 Security Guidelines

### Reporting Security Issues

**Do not** create public GitHub issues for security vulnerabilities.

Instead, email security@ai-code-review.com with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Security Best Practices

- Validate all inputs
- Use parameterized queries
- Implement proper authentication
- Follow OWASP guidelines
- Keep dependencies updated

## 🏷️ Release Process

### Versioning

We use [Semantic Versioning](https://semver.org/):
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes (backward compatible)

### Release Notes

Include in release notes:
- New features
- Bug fixes
- Breaking changes
- Migration instructions
- Dependencies updates

## 🤝 Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Give constructive feedback
- Focus on what's best for the community
- Show empathy towards others

### Communication

- Use clear, concise language
- Provide context and examples
- Be patient with questions
- Search existing issues before creating new ones

## 🎯 Good First Issues

New contributors should look for issues labeled:
- `good first issue`
- `help wanted`
- `documentation`
- `beginner friendly`

These issues are specifically chosen to be approachable for newcomers.

## 📞 Getting Help

- **Documentation**: Check README and inline comments
- **Issues**: Search existing GitHub issues
- **Discussions**: Use GitHub Discussions for questions
- **Discord**: Join our community Discord server (if available)

## 🙏 Recognition

Contributors will be recognized in:
- README contributors section
- Release notes
- Project documentation
- Annual contributor highlights

Thank you for contributing to AI Code Review Assistant! 🎉