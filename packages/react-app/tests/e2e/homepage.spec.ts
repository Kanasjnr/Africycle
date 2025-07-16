import { test, expect } from '@playwright/test'

test.describe('Homepage E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display hero section with correct content', async ({ page }) => {
    // Check hero heading
    await expect(page.getByRole('heading', { name: /AfriCycle/ })).toBeVisible()
    
    // Check hero description
    await expect(page.getByText(/blockchain-powered circular economy/i)).toBeVisible()
    
    // Check that hero animation canvas is present
    await expect(page.locator('canvas')).toBeVisible()
  })

  test('should navigate to dashboard when wallet is connected', async ({ page }) => {
    // Mock wallet connection (in real test you'd use actual wallet)
    await page.route('**/api/wallet/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ connected: true, address: '0x123...' })
      })
    })

    // Look for connect button or navigation
    const connectButton = page.getByRole('button', { name: /connect/i })
    if (await connectButton.isVisible()) {
      await connectButton.click()
    }

    // Check if dashboard navigation appears
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible()
  })

  test('should display features section', async ({ page }) => {
    // Scroll to features section
    await page.locator('#features').scrollIntoViewIfNeeded()
    
    // Check for key features
    await expect(page.getByText(/Multi-Stream Collection/i)).toBeVisible()
    await expect(page.getByText(/Dual Income System/i)).toBeVisible()
    await expect(page.getByText(/Blockchain Verification/i)).toBeVisible()
  })

  test('should display waste streams section', async ({ page }) => {
    // Check waste stream categories
    await expect(page.getByText(/Plastic Waste/i)).toBeVisible()
    await expect(page.getByText(/Electronic Waste/i)).toBeVisible()
    await expect(page.getByText(/Metal & General Waste/i)).toBeVisible()
  })

  test('should display stakeholders section', async ({ page }) => {
    // Check stakeholder categories
    await expect(page.getByText(/Waste Collectors/i)).toBeVisible()
    await expect(page.getByText(/Recycling Facilities/i)).toBeVisible()
    await expect(page.getByText(/Corporations/i)).toBeVisible()
    await expect(page.getByText(/Local Communities/i)).toBeVisible()
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check that content is still visible and accessible
    await expect(page.getByRole('heading', { name: /AfriCycle/ })).toBeVisible()
    
    // Check mobile menu button if present
    const mobileMenuButton = page.getByRole('button', { name: /menu/i })
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click()
      // Check if menu opens
      await expect(page.getByRole('navigation')).toBeVisible()
    }
  })
})
