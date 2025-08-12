## Description
<!-- Provide a clear and concise description of the changes made -->

## Type of Change
<!-- Mark the appropriate option(s) with [x] -->

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Security enhancement
- [ ] Code refactoring
- [ ] Test addition or improvement
- [ ] Configuration change
- [ ] Deployment/DevOps change

## Related Issues
<!-- Link to any related issues using #issue_number -->

Closes #(issue number)
Related to #(issue number)

## Testing
<!-- Describe the tests you ran and their results -->

### Test Coverage
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] All tests pass locally
- [ ] Test coverage maintained/improved (minimum 80% for frontend, 90% for smart contracts)

### Test Results
```bash
# Frontend tests
yarn workspace @africycle/react-app test:coverage

# Smart contract tests
yarn workspace @africycle/hardhat coverage

# E2E tests
yarn workspace @africycle/react-app test:e2e
```

**Coverage Report:**
- Frontend: XX% (target: 80%)
- Smart Contracts: XX% (target: 90%)

## Checklist
<!-- Mark all items that apply with [x] -->

### Code Quality
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code where necessary
- [ ] My changes generate no new warnings
- [ ] I have checked my code and corrected any misspellings

### Documentation
- [ ] I have updated the documentation
- [ ] I have added JSDoc comments for new functions
- [ ] I have updated API documentation if applicable
- [ ] I have updated README.md if needed

### Testing
- [ ] I have added tests that prove my fix is effective
- [ ] All tests pass
- [ ] I have tested my changes in the development environment
- [ ] I have tested my changes in the staging environment (if applicable)

### Security
- [ ] I have reviewed the security implications of my changes
- [ ] I have not introduced any security vulnerabilities
- [ ] I have followed security best practices
- [ ] I have validated all inputs and outputs

### Performance
- [ ] I have considered the performance impact of my changes
- [ ] I have optimized database queries if applicable
- [ ] I have optimized frontend bundle size if applicable
- [ ] I have tested performance in realistic scenarios

## Screenshots (if applicable)
<!-- Add screenshots for UI changes -->

### Before
<!-- Screenshot of the UI before the change -->

### After
<!-- Screenshot of the UI after the change -->

## Environment
<!-- Describe the environment where you tested your changes -->

- **OS**: [e.g., macOS, Ubuntu, Windows]
- **Node.js Version**: [e.g., 18.17.0]
- **Package Manager**: [e.g., Yarn 1.22.19]
- **Browser**: [e.g., Chrome 120, Firefox 121] (for frontend changes)
- **Blockchain Network**: [e.g., Alfajores testnet, Celo mainnet] (for smart contract changes)

## Additional Notes
<!-- Any additional information that reviewers should know -->

## Breaking Changes
<!-- If this PR includes breaking changes, describe them here -->

### Migration Guide
<!-- If breaking changes require migration, provide a guide -->

## Dependencies
<!-- List any new dependencies added or removed -->

### Added
- `package-name@version` - Reason for addition

### Removed
- `package-name@version` - Reason for removal

### Updated
- `package-name@version` - Reason for update

## Deployment Notes
<!-- Any special considerations for deployment -->

## Rollback Plan
<!-- How to rollback these changes if needed -->

---

## Review Guidelines

### For Reviewers
- [ ] Code follows project standards
- [ ] Tests are comprehensive and pass
- [ ] Documentation is updated
- [ ] Security implications are considered
- [ ] Performance impact is acceptable
- [ ] Breaking changes are documented
- [ ] Migration guide is provided (if needed)

### Review Checklist
- [ ] **Functionality**: Does the code work as intended?
- [ ] **Security**: Are there any security vulnerabilities?
- [ ] **Performance**: Is the performance acceptable?
- [ ] **Maintainability**: Is the code maintainable?
- [ ] **Testability**: Is the code testable?
- [ ] **Documentation**: Is the documentation clear and complete?
- [ ] **Standards**: Does the code follow project standards?

---

**Thank you for contributing to Africycle! 🌍♻️** 