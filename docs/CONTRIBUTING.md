# Contributing to Africycle

Thank you for your interest in contributing to Africycle! This document provides comprehensive guidelines and instructions for contributing to the project. Please read it carefully before making any contributions.

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
- [Community Guidelines](#community-guidelines)
- [Troubleshooting](#troubleshooting)
- [Communication Channels](#communication-channels)

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

Examples of unacceptable behavior:
- The use of sexualized language or imagery
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate

## Getting Started

### Prerequisites

- Node.js (v18 or later) - [Download here](https://nodejs.org/)
- Yarn (v1.22 or later) - [Install guide](https://classic.yarnpkg.com/en/docs/install/)
- Git - [Download here](https://git-scm.com/)
- A code editor (VS Code recommended) - [Download here](https://code.visualstudio.com/)
- MetaMask or Valora wallet - [MetaMask](https://metamask.io/) | [Valora](https://valoraapp.com/)
- PostgreSQL (for local development) - [Download here](https://www.postgresql.org/download/)
- Docker (optional, for containerized development) - [Download here](https://www.docker.com/)

### Initial Setup

1. **Fork the repository**
   - Go to [https://github.com/Kanasjnr/Africycle](https://github.com/Kanasjnr/Africycle)
   - Click the "Fork" button in the top right
   - This creates your own copy of the repository

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Africycle.git
   cd Africycle
   ```

3. **Set up the upstream remote**
   ```bash
   git remote add upstream https://github.com/Kanasjnr/Africycle.git
   git fetch upstream
   ```

4. **Install dependencies**
   ```bash
   yarn install
   ```

5. **Set up environment variables**
   ```bash
   # Copy environment files
   cp docker.env.example .env
   cp packages/react-app/.env.example packages/react-app/.env
   cp packages/hardhat/.env.example packages/hardhat/.env
   ```
   
   **⚠️ IMPORTANT**: Edit the `.env` files and replace all placeholder values with your actual credentials. Never commit real private keys or API keys to version control.

6. **Start the development environment**

   **Option A: Docker (Recommended)**
   ```bash
   # One-command setup
   ./scripts/docker-setup.sh
   ```

   **Option B: Manual Setup**
   ```bash
   # Start PostgreSQL (if not using Docker)
   # Start frontend
   yarn workspace @africycle/react-app dev
   
   # In another terminal, start hardhat node
   yarn workspace @africycle/hardhat node
   ```

7. **Verify your setup**
   - Frontend should be running at: http://localhost:3000
   - Hardhat node should be running at: http://localhost:8545
   - Database should be accessible at: localhost:5432

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `staging` - Integration branch for features
- `feature/*` - Feature development branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Critical production fixes

### Creating a New Feature

1. **Update your local staging branch**
   ```bash
   git checkout staging
   git pull upstream staging
   ```

2. **Create a new feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the code style guidelines below
   - Write tests for new functionality
   - Update documentation as needed

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```
   
   **Commit Message Format:**
   - `feat:` - New features
   - `fix:` - Bug fixes
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting, etc.)
   - `refactor:` - Code refactoring
   - `test:` - Adding or updating tests
   - `chore:` - Maintenance tasks

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Go to your fork on GitHub
   - Click "Compare & pull request"
   - Fill out the PR template
   - Request review from maintainers

### Keeping Your Fork Updated

```bash
git fetch upstream
git checkout staging
git merge upstream/staging
git push origin staging
```

## Code Style and Standards

### General Guidelines

- Write clear, self-documenting code
- Use meaningful variable and function names
- Keep functions small and focused (max 20-30 lines)
- Comment complex logic
- Follow the DRY (Don't Repeat Yourself) principle
- Use TypeScript for all new code
- Enable strict mode in `tsconfig.json`

### TypeScript/JavaScript

- Use TypeScript for all new code
- Enable strict mode in `tsconfig.json`
- Use ESLint and Prettier for code formatting
- Follow the Airbnb JavaScript Style Guide
- Use async/await over raw promises
- Use proper type annotations
- Avoid `any` type - use proper types or `unknown`

**Example:**
```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

const getUser = async (id: string): Promise<User> => {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
};

// Bad
const getUser = async (id: any): Promise<any> => {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
};
```

### Solidity

- Follow the Solidity Style Guide
- Use latest stable Solidity version (0.8.x)
- Implement proper access control
- Add NatSpec comments
- Use events for important state changes
- Implement proper error handling
- Use SafeMath (built into Solidity 0.8+)

**Example:**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title Africycle Contract
 * @dev Manages waste collection and recycling processes
 * @author Africycle Team
 */
contract Africycle is AccessControl, ReentrancyGuard {
    bytes32 public constant COLLECTOR_ROLE = keccak256("COLLECTOR_ROLE");
    bytes32 public constant RECYCLER_ROLE = keccak256("RECYCLER_ROLE");
    
    event WasteCollected(address indexed collector, uint256 amount, uint256 timestamp);
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @dev Submit waste collection
     * @param amount Amount of waste collected
     */
    function submitWasteCollection(uint256 amount) 
        external 
        onlyRole(COLLECTOR_ROLE) 
        nonReentrant 
    {
        require(amount > 0, "Amount must be greater than 0");
        
        // Process collection logic here
        
        emit WasteCollected(msg.sender, amount, block.timestamp);
    }
}
```

### React/Next.js

- Use functional components with hooks
- Follow React best practices
- Implement proper error boundaries
- Use proper TypeScript types
- Follow Next.js 14 conventions
- Use proper data fetching methods
- Implement proper loading states

**Example:**
```typescript
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

interface UserProfile {
  id: string;
  name: string;
  role: 'collector' | 'recycler';
}

export const UserProfile: React.FC = () => {
  const { address } = useAccount();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/profile/${address}`);
        if (!response.ok) throw new Error('Failed to fetch profile');
        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (address) {
      fetchProfile();
    }
  }, [address]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!profile) return <div>No profile found</div>;

  return (
    <div>
      <h1>{profile.name}</h1>
      <p>Role: {profile.role}</p>
    </div>
  );
};
```

## Testing

### Testing Strategy

We use a **3-tier comprehensive testing approach**:

1. **Unit Tests** - Fast, isolated component tests
2. **Integration Tests** - Real blockchain interaction tests  
3. **E2E Tests** - Full browser user flow tests

### Frontend Testing

- Write unit tests for components
- Write integration tests for features
- Use React Testing Library
- Maintain minimum 80% test coverage
- Test error cases and edge cases

```bash
# Run all frontend tests
yarn workspace @africycle/react-app test

# Run unit tests only
yarn workspace @africycle/react-app test:unit

# Run integration tests only
yarn workspace @africycle/react-app test:integration

# Run E2E tests only
yarn workspace @africycle/react-app test:e2e

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

# Run specific test file
yarn workspace @africycle/hardhat test test/Africycle.test.ts
```

### Test Examples

**Unit Test Example:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  test('renders button with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  test('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

**Integration Test Example:**
```typescript
import { renderHook } from '@testing-library/react';
import { useAfriCycle } from '@/hooks/useAfricycle';

describe('useAfriCycle Hook', () => {
  test('connects to real blockchain', async () => {
    const { result } = renderHook(() => useAfriCycle({ 
      contractAddress: '0x123...', 
      rpcUrl: 'https://alfajores-forno.celo-testnet.org' 
    }));
    
    // Tests real blockchain interaction
    expect(result.current.isConnected).toBeDefined();
  });
});
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

### Before Submitting

1. **Ensure all tests pass**
   ```bash
   yarn test
   yarn workspace @africycle/hardhat test
   ```

2. **Check code coverage**
   ```bash
   yarn workspace @africycle/react-app test:coverage
   yarn workspace @africycle/hardhat coverage
   ```

3. **Run linting**
   ```bash
   yarn lint
   ```

4. **Update documentation**
   - Update README.md if needed
   - Add JSDoc comments for new functions
   - Update API documentation

### PR Template

```markdown
## Description
[Describe your changes here]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Security enhancement

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] All tests pass locally
- [ ] Test coverage maintained/improved

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective
- [ ] All tests pass
- [ ] I have checked my code and corrected any misspellings
- [ ] I have tested my changes in the development environment

## Screenshots (if applicable)
[Add screenshots for UI changes]

## Additional Notes
[Any additional information]
```

### Review Process

1. **Create Pull Request** to `staging` branch
2. **Request review** from maintainers
3. **Address review comments** promptly
4. **Get approval** from at least one maintainer
5. **Merge** after approval

## Smart Contract Development

### Security Guidelines

- Follow security best practices
- Use OpenZeppelin contracts
- Implement proper access control
- Add reentrancy guards where needed
- Use safe math operations
- Implement proper upgrade patterns
- Get security audits before mainnet deployment

### Development Process

1. **Local Development**
   ```bash
   yarn workspace @africycle/hardhat node
   yarn workspace @africycle/hardhat compile
   yarn workspace @africycle/hardhat test
   ```

2. **Testnet Deployment**
   ```bash
   yarn workspace @africycle/hardhat deploy --network alfajores
   ```

3. **Mainnet Deployment**
   ```bash
   yarn workspace @africycle/hardhat deploy --network celo
   ```

### Contract Verification

```bash
# Verify on CeloScan
yarn workspace @africycle/hardhat verify --network celo CONTRACT_ADDRESS
```

## Frontend Development

### Component Guidelines

- Use atomic design principles
- Implement proper error handling
- Use proper loading states
- Implement proper form validation
- Use proper state management
- Follow accessibility guidelines (WCAG 2.1)

### Performance Guidelines

- Optimize images and assets
- Implement proper caching
- Use proper code splitting
- Optimize bundle size
- Use proper lazy loading
- Monitor performance metrics

### State Management

- Use React Query for server state
- Use Context API for global state
- Use local state for component-specific state
- Avoid prop drilling

## Community Guidelines

### Communication

- Be respectful and inclusive
- Use clear, concise language
- Ask questions when unsure
- Share knowledge and help others
- Provide constructive feedback

### Issue Reporting

When reporting issues:

1. **Use the issue template**
2. **Provide clear steps to reproduce**
3. **Include error messages and logs**
4. **Add screenshots if applicable**
5. **Specify your environment**

### Feature Requests

When requesting features:

1. **Describe the problem you're solving**
2. **Explain why this feature is needed**
3. **Provide use cases**
4. **Consider implementation complexity**

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules
   yarn cache clean
   yarn install
   ```

2. **Test Failures**
   ```bash
   # Check test environment
   yarn workspace @africycle/react-app test --verbose
   ```

3. **Contract Deployment Issues**
   ```bash
   # Check network connection
   yarn workspace @africycle/hardhat node --fork https://alfajores-forno.celo-testnet.org
   ```

4. **Database Connection Issues**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   ```

### Getting Help

- Check existing issues
- Search documentation
- Ask in discussions
- Join our community chat
- Contact maintainers

## Communication Channels

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Telegram**: For real-time chat and community building
- **X/Twitter**: For updates and discussions
- **Email**: For security issues (see SECURITY.md)

## Additional Resources

- [Project Documentation](docs/)
- [Environment Setup](docs/ENVIRONMENT.md)
- [Smart Contract Documentation](docs/SMART_CONTRACTS.md)
- [Frontend Documentation](docs/FRONTEND.md)
- [Security Guidelines](docs/SECURITY.md)
- [Bug Bounty Program](docs/BUG_BOUNTY.md)

## License

By contributing to Africycle, you agree that your contributions will be licensed under the project's MIT License.

---

Thank you for contributing to Africycle! Your contributions help make waste management more sustainable and transparent in Africa. 🌍♻️ 