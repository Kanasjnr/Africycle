import { beforeAll, beforeEach, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// Extend expect matchers
import * as matchers from '@testing-library/jest-dom/matchers'
expect.extend(matchers)

// Clean up after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Mock environment variables for integration tests
beforeAll(() => {
  process.env.NEXT_PUBLIC_CELO_RPC_URL = 'https://alfajores-forno.celo-testnet.org'
  process.env.NEXT_PUBLIC_AFRICYCLE_CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890'
  process.env.NEXT_PUBLIC_WC_PROJECT_ID = 'test-project-id'
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'test-cloud'
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET = 'test-preset'
})

// Mock DOM APIs that may not be available in jsdom
// Mock ResizeObserver
const ResizeObserverMock = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
})) as any;

global.ResizeObserver = ResizeObserverMock;

// Mock IntersectionObserver
const IntersectionObserverMock = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
})) as any;

global.IntersectionObserver = IntersectionObserverMock;

// Mock canvas context for hero animations
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillStyle: '',
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  strokeStyle: '',
  stroke: vi.fn(),
  lineWidth: 1,
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  scale: vi.fn(),
  createLinearGradient: vi.fn(),
  createRadialGradient: vi.fn(),
  createPattern: vi.fn(),
  drawImage: vi.fn(),
  getImageData: vi.fn(),
  putImageData: vi.fn(),
  createImageData: vi.fn(),
  setTransform: vi.fn(),
  resetTransform: vi.fn(),
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
  shadowBlur: 0,
  shadowColor: '',
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  filter: 'none',
  imageSmoothingEnabled: true,
  lineCap: 'butt',
  lineJoin: 'miter',
  miterLimit: 10,
  textAlign: 'start',
  textBaseline: 'alphabetic',
  font: '10px sans-serif',
  fillText: vi.fn(),
  strokeText: vi.fn(),
  measureText: vi.fn(),
  canvas: {} as HTMLCanvasElement,
  getLineDash: vi.fn(),
  setLineDash: vi.fn(),
  lineDashOffset: 0,
  direction: 'ltr',
  clip: vi.fn(),
  quadraticCurveTo: vi.fn(),
  bezierCurveTo: vi.fn(),
  arcTo: vi.fn(),
  ellipse: vi.fn(),
  rect: vi.fn(),
  roundRect: vi.fn(),
  isPointInPath: vi.fn(),
  isPointInStroke: vi.fn(),
  scrollPathIntoView: vi.fn(),
  createConicGradient: vi.fn(),
  fontKerning: 'auto',
  fontStretch: 'normal',
  fontVariantCaps: 'normal',
  letterSpacing: '0px',
  textRendering: 'auto',
  wordSpacing: '0px',
  imageSmoothingQuality: 'low',
})) as any;

// Mock window methods
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true,
})

Object.defineProperty(window, 'matchMedia', {
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
  writable: true,
})

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb: any) => {
  return setTimeout(cb, 16) as any;
});
global.cancelAnimationFrame = vi.fn(id => clearTimeout(id))

// Note: For integration tests, we DON'T mock wagmi hooks
// This allows real blockchain interactions with test networks
