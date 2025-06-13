// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock window.ethereum
const mockEthereum = {
  request: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
  isMetaMask: true,
}

Object.defineProperty(window, 'ethereum', {
  value: mockEthereum,
  writable: true,
})

// Mock Web3
jest.mock('web3', () => {
  return jest.fn().mockImplementation(() => ({
    eth: {
      Contract: jest.fn(),
      getAccounts: jest.fn(),
      getBalance: jest.fn(),
    },
    utils: {
      toWei: jest.fn(),
      fromWei: jest.fn(),
    },
  }))
})

// Mock next/router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: {},
      asPath: '',
      push: jest.fn(),
      replace: jest.fn(),
    }
  },
}))

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks()
}) 