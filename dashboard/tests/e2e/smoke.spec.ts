/**
 * Smoke E2E Tests - Data Maturity Dashboard
 * @author andreas@siglochconsulting
 */

import { test, expect } from '@playwright/test'

test.describe('Dashboard Smoke Tests', () => {
  test('App loads and graph is displayed', async ({ page }) => {
    await page.goto('/')

    // Wait for app to load
    await expect(page.getByTestId('app-container')).toBeVisible()

    // Graph view should be visible (default tab)
    await expect(page.getByTestId('graph-view')).toBeVisible()

    // Graph canvas should be present
    await expect(page.getByTestId('graph-canvas')).toBeVisible()

    // Legend should be visible
    await expect(page.getByTestId('graph-legend')).toBeVisible()
  })

  test('Tab switching works', async ({ page }) => {
    await page.goto('/')

    // Click on Centrality Metrics tab
    await page.getByTestId('tab-centrality').click()

    // Centrality panel should be visible
    await expect(page.getByTestId('centrality-panel')).toBeVisible()

    // Stats should be visible
    await expect(page.getByTestId('centrality-stats')).toBeVisible()

    // Switch back to graph
    await page.getByTestId('tab-graph').click()
    await expect(page.getByTestId('graph-view')).toBeVisible()
  })

  test('Filter input works', async ({ page }) => {
    await page.goto('/')

    // Search input should be visible on graph tab
    const searchInput = page.getByTestId('search-input')
    await expect(searchInput).toBeVisible()

    // Type in search input
    await searchInput.fill('SYS')

    // Verify input value changed
    await expect(searchInput).toHaveValue('SYS')

    // Reset button should work
    await page.getByTestId('reset-filters-button').click()
    await expect(searchInput).toHaveValue('')
  })
})
