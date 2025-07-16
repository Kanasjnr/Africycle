# Testing Strategy - Hybrid Approach

This project uses a **hybrid testing approach** with three types of tests:

## 🧪 **1. Unit Tests (Jest + React Testing Library)**
- **Location**: `tests/unit/`
- **Purpose**: Test individual components in isolation with mocks
- **Run**: `npm run test:unit`
- **Watch**: `npm run test:watch`

**Example:**
```bash
npm run test:unit
```

**Features:**
- Fast execution
- Mocked dependencies (wagmi, next/router, etc.)
- Component behavior testing
- Snapshot testing support

## 🔗 **2. Integration Tests (Vitest)**
- **Location**: `tests/integration/`
- **Purpose**: Test hooks and components with real blockchain interactions
- **Run**: `npm run test:integration`
- **Watch**: `npm run test:integration:watch`

**Example:**
```bash
npm run test:integration
```

**Features:**
- Real blockchain calls to Alfajores testnet
- Real wagmi hooks (no mocks)
- 30-second timeout for blockchain operations
- Tests actual smart contract interactions

## 🌐 **3. End-to-End Tests (Playwright)**
- **Location**: `tests/e2e/`
- **Purpose**: Test complete user flows in real browser
- **Run**: `npm run test:e2e`
- **UI Mode**: `npm run test:e2e:ui`

**Example:**
```bash
npm run test:e2e
```

**Features:**
- Real browser testing (Chrome, Firefox, Safari)
- Mobile device testing
- Screenshot/video on failure
- Wallet connection simulation
- Full user journey testing

## 📊 **Test Coverage**
```bash
npm run test:coverage
```

## 🚀 **Running All Tests**
```bash
npm test
```

## 🔧 **Test Configuration Files**

### Unit Tests
- `jest.config.js` - Jest configuration
- `jest.setup.js` - Test environment setup with mocks

### Integration Tests
- `vitest.config.ts` - Vitest configuration
- `tests/integration/setup.ts` - Integration test setup (no mocks)

### E2E Tests
- `playwright.config.ts` - Playwright configuration
- Supports multiple browsers and devices

## 📁 **Test Structure**
```
tests/
├── unit/           # Fast, isolated component tests
├── integration/    # Real blockchain interaction tests
├── e2e/           # Full browser user flow tests
└── README.md      # This file
```

## 🎯 **When to Use Each Type**

### Unit Tests ✅
- Testing component rendering
- Testing event handlers
- Testing utility functions
- Testing component props/state

### Integration Tests ✅
- Testing hooks with real blockchain
- Testing wallet connections
- Testing smart contract interactions
- Testing provider context

### E2E Tests ✅
- Testing complete user workflows
- Testing wallet connect flows
- Testing responsive design
- Testing cross-browser compatibility

## 🔍 **Test Examples**

### Unit Test Example
```typescript
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

test('renders button', () => {
  render(<Button>Click me</Button>)
  expect(screen.getByText('Click me')).toBeInTheDocument()
})
```

### Integration Test Example
```typescript
import { renderHook } from '@testing-library/react'
import { useAfriCycle } from '@/hooks/useAfricycle'

test('connects to real blockchain', async () => {
  const { result } = renderHook(() => useAfriCycle({ 
    contractAddress: '0x123...', 
    rpcUrl: 'https://alfajores-forno.celo-testnet.org' 
  }))
  // Tests real blockchain interaction
})
```

### E2E Test Example
```typescript
import { test, expect } from '@playwright/test'

test('user can navigate homepage', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('AfriCycle')).toBeVisible()
})
```

## 🎭 **Playwright Browser Support**
- ✅ Desktop Chrome
- ✅ Desktop Firefox  
- ✅ Desktop Safari
- ✅ Mobile Chrome (Pixel 5)
- ✅ Mobile Safari (iPhone 12)

## 🔗 **Dependencies**
```json
{
  "unit": ["jest", "@testing-library/react", "@testing-library/jest-dom"],
  "integration": ["vitest", "@testing-library/react", "wagmi", "viem"],
  "e2e": ["@playwright/test"]
}
```

## 🐛 **Debugging Tests**

### Unit Tests
```bash
npm run test:watch
```

### Integration Tests
```bash
npm run test:integration:watch
```

### E2E Tests
```bash
npm run test:e2e:ui
```

## 🎖️ **Best Practices**

1. **Unit Tests**: Mock external dependencies
2. **Integration Tests**: Use real blockchain calls
3. **E2E Tests**: Test complete user workflows
4. **Coverage**: Aim for >80% coverage
5. **Speed**: Unit tests should be fast (<1s each)
6. **Reliability**: Integration tests should use stable testnet
7. **Maintenance**: Keep tests simple and focused

---

This hybrid approach ensures comprehensive testing coverage while maintaining fast feedback loops during development.
