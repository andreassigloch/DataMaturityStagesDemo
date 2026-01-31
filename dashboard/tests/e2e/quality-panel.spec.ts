/**
 * CR-010 E2E Tests - QualityPanel Component
 * Tests for Quality tab with Validierung, Scoring, Optimierung sections
 * @author andreas@siglochconsulting
 */

import { test, expect } from '@playwright/test'

test.describe('CR-010: QualityPanel E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for app to load
    await expect(page.getByTestId('app-container')).toBeVisible()
  })

  test.describe('Quality Tab Navigation', () => {
    test('Quality tab is visible and clickable', async ({ page }) => {
      // Quality tab should exist in navigation
      const qualityTab = page.getByTestId('tab-quality')
      await expect(qualityTab).toBeVisible()
      await expect(qualityTab).toContainText('Qualität')
    })

    test('Clicking Quality tab shows QualityPanel', async ({ page }) => {
      // Click Quality tab
      await page.getByTestId('tab-quality').click()

      // QualityPanel should be visible
      await expect(page.getByTestId('quality-panel')).toBeVisible()
    })

    test('Quality tab shows stats header', async ({ page }) => {
      await page.getByTestId('tab-quality').click()

      // Stats header should show 4 metrics
      const statsPanel = page.getByTestId('quality-stats')
      await expect(statsPanel).toBeVisible()

      await expect(page.getByTestId('stat-errors')).toBeVisible()
      await expect(page.getByTestId('stat-warnings')).toBeVisible()
      await expect(page.getByTestId('stat-score')).toBeVisible()
      await expect(page.getByTestId('stat-suggestions')).toBeVisible()
    })
  })

  test.describe('Quality Sub-Tab Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByTestId('tab-quality').click()
      await expect(page.getByTestId('quality-panel')).toBeVisible()
    })

    test('Three sub-tabs are visible', async ({ page }) => {
      await expect(page.getByTestId('quality-tab-validierung')).toBeVisible()
      await expect(page.getByTestId('quality-tab-scoring')).toBeVisible()
      await expect(page.getByTestId('quality-tab-optimierung')).toBeVisible()
    })

    test('Validierung tab is active by default', async ({ page }) => {
      const validierungTab = page.getByTestId('quality-tab-validierung')
      // Active tab should have primary color border (checking class presence)
      await expect(validierungTab).toHaveClass(/border-\[var\(--color-primary\)\]|border-b-2/)
    })

    test('Clicking Scoring tab switches content', async ({ page }) => {
      await page.getByTestId('quality-tab-scoring').click()

      // Scoring content should be visible (either list or empty state)
      const scoringList = page.getByTestId('scoring-list')
      const scoringEmpty = page.getByTestId('scoring-empty')
      const isListVisible = await scoringList.isVisible().catch(() => false)
      const isEmptyVisible = await scoringEmpty.isVisible().catch(() => false)

      expect(isListVisible || isEmptyVisible).toBe(true)
    })

    test('Clicking Optimierung tab switches content', async ({ page }) => {
      await page.getByTestId('quality-tab-optimierung').click()

      // Optimization content should be visible (either list or empty state)
      const optimizationList = page.getByTestId('optimization-list')
      const optimizationEmpty = page.getByTestId('optimization-empty')
      const isListVisible = await optimizationList.isVisible().catch(() => false)
      const isEmptyVisible = await optimizationEmpty.isVisible().catch(() => false)

      expect(isListVisible || isEmptyVisible).toBe(true)
    })
  })

  test.describe('Validation Section', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByTestId('tab-quality').click()
      // Validierung is default tab
    })

    test('Shows empty state or violations list', async ({ page }) => {
      const validationList = page.getByTestId('validation-list')
      const validationEmpty = page.getByTestId('validation-empty')
      const isListVisible = await validationList.isVisible().catch(() => false)
      const isEmptyVisible = await validationEmpty.isVisible().catch(() => false)

      expect(isListVisible || isEmptyVisible).toBe(true)

      // If empty, should show checkmark
      if (isEmptyVisible) {
        await expect(validationEmpty).toContainText('Keine Verstöße')
      }
    })
  })

  test.describe('Scoring Section', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByTestId('tab-quality').click()
      await page.getByTestId('quality-tab-scoring').click()
    })

    test('Shows empty state or scoring items', async ({ page }) => {
      const scoringList = page.getByTestId('scoring-list')
      const scoringEmpty = page.getByTestId('scoring-empty')
      const isListVisible = await scoringList.isVisible().catch(() => false)
      const isEmptyVisible = await scoringEmpty.isVisible().catch(() => false)

      expect(isListVisible || isEmptyVisible).toBe(true)

      // If empty, should show chart emoji
      if (isEmptyVisible) {
        await expect(scoringEmpty).toContainText('Keine Scoring-Regeln')
      }
    })
  })

  test.describe('Optimization Section', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByTestId('tab-quality').click()
      await page.getByTestId('quality-tab-optimierung').click()
    })

    test('Shows empty state or optimization suggestions', async ({ page }) => {
      const optimizationList = page.getByTestId('optimization-list')
      const optimizationEmpty = page.getByTestId('optimization-empty')
      const isListVisible = await optimizationList.isVisible().catch(() => false)
      const isEmptyVisible = await optimizationEmpty.isVisible().catch(() => false)

      expect(isListVisible || isEmptyVisible).toBe(true)

      // If empty, should show lightning emoji
      if (isEmptyVisible) {
        await expect(optimizationEmpty).toContainText('Keine Optimierungen')
      }
    })
  })

  test.describe('Tab Persistence', () => {
    test('Quality tab stays active when switching sub-tabs', async ({ page }) => {
      await page.getByTestId('tab-quality').click()
      await page.getByTestId('quality-tab-scoring').click()
      await page.getByTestId('quality-tab-optimierung').click()

      // Main Quality tab should still be active
      const qualityTab = page.getByTestId('tab-quality')
      await expect(qualityTab).toHaveClass(/text-\[var\(--color-primary\)\]|border-\[var\(--color-primary\)\]/)
    })

    test('Switching away and back preserves sub-tab state', async ({ page }) => {
      await page.getByTestId('tab-quality').click()
      await page.getByTestId('quality-tab-scoring').click()

      // Switch to graph tab
      await page.getByTestId('tab-graph').click()
      await expect(page.getByTestId('graph-view')).toBeVisible()

      // Switch back to quality
      await page.getByTestId('tab-quality').click()

      // Should still be on scoring sub-tab
      const scoringTab = page.getByTestId('quality-tab-scoring')
      await expect(scoringTab).toHaveClass(/border-\[var\(--color-primary\)\]|text-\[var\(--color-primary\)\]/)
    })
  })
})
