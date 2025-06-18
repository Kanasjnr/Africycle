# Contributing to Africycle

Thank you for your interest in contributing to Africycle! This document provides guidelines and instructions for contributing to the project. Please read it carefully before making any contributions.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style and Standards](#code-style-and-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Smart Contract Development](#smart-contract-development)
- [Frontend Development](#frontend-development)
- [Troubleshooting](#troubleshooting)

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please read it before contributing.

### Our Pledge

We are committed to making participation in this project a harassment-free experience for everyone, regardless of:
- Experience level
- Gender identity and expression
- Sexual orientation
- Disability
- Personal appearance
- Body size
- Race
- Ethnicity
- Age
- Religion
- Nationality

### Our Standards

Examples of behavior that contributes to a positive environment:
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- Yarn (v1.22 or later)
- Git
- A code editor (VS Code recommended)
- MetaMask or Valora wallet
- PostgreSQL (for local development)

### Initial Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Africycle.git
   cd Africycle
   ```
3. Install dependencies:
   ```bash
   yarn install
   ```
4. Set up environment variables:
   ```bash
   # Copy environment files
   cp packages/react-app/.env.example packages/react-app/.env
   cp packages/hardhat/.env.example packages/hardhat/.env
   ```
   See [Environment Variables Documentation](ENVIRONMENT.md) for details.

5. Start the development environment:
   ```bash
   # Start frontend
   yarn workspace @africycle/react-app dev
   
   # In another terminal, start hardhat node
   yarn workspace @africycle/hardhat node
   ```

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `Staging` - Integration branch for features


### Creating a New Feature

1. Create a new branch from `staging`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. Make your changes, following the code style guidelines

3. Write or update tests as needed

4. Commit your changes:
   ```bash
   git commit -m "feat: add your feature description"
   ```

5. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

6. Create a Pull Request to the `staging` branch

## Code Style and Standards

### General Guidelines

- Write clear, self-documenting code
- Use meaningful variable and function names
- Keep functions small and focused
- Comment complex logic
- Follow the DRY (Don't Repeat Yourself) principle

### TypeScript/JavaScript

- Use TypeScript for all new code
- Enable strict mode in `tsconfig.json`
- Use ESLint and Prettier for code formatting
- Follow the Airbnb JavaScript Style Guide
- Use async/await over raw promises
- Use proper type annotations

### Solidity

- Follow the Solidity Style Guide
- Use latest stable Solidity version
- Implement proper access control
- Add NatSpec comments
- Use events for important state changes
- Implement proper error handling

### React/Next.js

- Use functional components with hooks
- Follow React best practices
- Implement proper error boundaries
- Use proper TypeScript types
- Follow Next.js 14 conventions
- Use proper data fetching methods

## Testing

### Frontend Testing

- Write unit tests for components
- Write integration tests for features
- Use React Testing Library
- Maintain minimum 70% test coverage
- Test error cases and edge cases

```bash
# Run frontend tests
yarn workspace @africycle/react-app test

# Run tests with coverage
yarn workspace @africycle/react-app test:coverage
```

### Smart Contract Testing

- Write unit tests for all contracts
- Test all public functions
- Test edge cases and error conditions
- Use proper test fixtures
- Maintain minimum 90% test coverage

```bash
# Run smart contract tests
yarn workspace @africycle/hardhat test

# Run tests with coverage
yarn workspace @africycle/hardhat coverage
```

## Documentation

### Code Documentation

- Document all public functions and classes
- Use JSDoc comments for TypeScript/JavaScript
- Use NatSpec comments for Solidity
- Keep documentation up to date
- Document complex algorithms

### Project Documentation

- Update README.md for major changes
- Document new environment variables
- Update API documentation
- Document breaking changes
- Keep setup instructions current

## Pull Request Process

1. Update documentation for any new features
2. Add tests for new functionality
3. Ensure all tests pass
4. Update the changelog
5. Follow the PR template
6. Request review from maintainers
7. Address review comments
8. Get approval from at least one maintainer

### PR Template

```markdown
## Description
[Describe your changes here]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests
- [ ] All tests pass
- [ ] I have checked my code and corrected any misspellings
```

## Smart Contract Development

### Security Guidelines

- Follow security best practices
- Use OpenZeppelin contracts
- Implement proper access control
- Add reentrancy guards where needed
- Use safe math operations
- Implement proper upgrade patterns

### Deployment Process

1. Test on local network
2. Deploy to testnet
3. Run tests on testnet
4. Get security review
5. Deploy to mainnet
6. Verify contracts
7. Update documentation

## Frontend Development

### Component Guidelines

- Use atomic design principles
- Implement proper error handling
- Use proper loading states
- Implement proper form validation
- Use proper state management
- Follow accessibility guidelines

### Performance Guidelines

- Optimize images and assets
- Implement proper caching
- Use proper code splitting
- Optimize bundle size
- Use proper lazy loading
- Monitor performance metrics

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version
   - Clear yarn cache
   - Delete node_modules and reinstall

2. **Test Failures**
   - Check test environment
   - Verify test data
   - Check for flaky tests

3. **Contract Deployment Issues**
   - Check network connection
   - Verify account balance
   - Check gas settings

### Getting Help

- Check existing issues
- Search documentation
- Ask in discussions
- Join our community chat
- Contact maintainers

## Additional Resources

- [Project Documentation](docs/)
- [Environment Setup](docs/ENVIRONMENT.md)
- [API Documentation](docs/API.md)
- [Smart Contract Documentation](docs/SMART_CONTRACTS.md)
- [Frontend Documentation](docs/FRONTEND.md)

## License

By contributing to Africycle, you agree that your contributions will be licensed under the project's MIT License. 