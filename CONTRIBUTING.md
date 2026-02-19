# Contributing to Tiler Quote App

Thank you for considering contributing to the Tiler Quote App! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and constructive in all interactions with other contributors.

## How to Contribute

### Reporting Bugs

Before submitting a bug report, please check the [existing issues](../../issues) to avoid duplicates.

When creating a bug report, include:
- **Title**: Clear, descriptive title
- **Description**: What you were doing when the bug occurred
- **Steps to reproduce**: Minimal steps to reproduce the issue
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happened
- **Environment**: Browser, OS, app version
- **Screenshots**: If applicable

### Suggesting Enhancements

Enhancement suggestions are welcome! When submitting:
- Use a clear, descriptive title
- Provide a detailed description of the enhancement
- Explain why this enhancement would be useful
- List some examples of similar functionality in other apps

### Submitting Code Changes

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/tiler-quote-app.git
   cd tiler-quote-app
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Make your changes**
   - Write clean, readable code
   - Follow the existing code style
   - Add comments for complex logic
   - Test your changes thoroughly

5. **Format and lint your code**
   ```bash
   npm run format
   npm run lint
   ```

6. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: describe your changes clearly"
   ```

   Use conventional commit messages:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation
   - `style:` for code style changes
   - `refactor:` for code refactoring
   - `perf:` for performance improvements
   - `test:` for test additions/modifications

7. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

8. **Create a Pull Request**
   - Use a clear, descriptive title
   - Reference any related issues: `Closes #123`
   - Describe what your PR accomplishes
   - Include any breaking changes
   - Wait for review and be responsive to feedback

## Development Setup

### Prerequisites
- Node.js 16+ and npm

### Setup
```bash
npm install
npm start
```

The app will open at `http://localhost:3000`

### Available Scripts
- `npm start` - Start development server
- `npm test` - Run tests
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Code Style Guidelines

- **Formatting**: 2-space indentation, semicolons required
- **React**: Use functional components with hooks
- **Comments**: Write comments for non-obvious logic
- **Naming**: Use descriptive variable and function names
- **Files**: Keep files under 300 lines when possible

### Example Component Structure
```javascript
import React, { useState, useEffect } from 'react';

function MyComponent({ prop1, prop2 }) {
  const [state, setState] = useState(null);

  useEffect(() => {
    // Side effects
  }, []);

  const handleClick = () => {
    // Event handlers
  };

  return (
    <div>
      {/* JSX */}
    </div>
  );
}

export default MyComponent;
```

## Testing

- Write tests for new features
- Run tests: `npm test`
- Aim for >80% code coverage
- Use React Testing Library for component tests

## Documentation

- Update README.md if adding features
- Document new props and parameters
- Include JSDoc comments for functions
- Update CHANGELOG.md (if it exists)

## Performance Considerations

- Minimize bundle size
- Use React.memo for expensive components
- Avoid unnecessary re-renders
- Optimize images and assets
- Consider lazy loading for large features

## Browser Support

Test your changes across:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers

## Questions?

- Check existing documentation and issues
- Open a discussion in the Discussions tab
- Ask in comments on related issues

## Review Process

Pull requests will be reviewed by maintainers:
1. Code review for quality and style
2. Testing to ensure no regressions
3. Documentation check
4. Merge or request changes

Thank you for contributing! 🙏
