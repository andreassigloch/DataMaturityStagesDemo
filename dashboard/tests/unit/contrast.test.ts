/**
 * WCAG AA Contrast Compliance Tests
 * @author andreas@siglochconsulting
 */

import { describe, it, expect } from 'vitest'

// Node colors from GraphView.tsx (must match, all WCAG AA compliant)
const NODE_COLORS: Record<string, string> = {
  StakeholderReq: '#4A90D9',
  SystemReq: '#7CB342',
  SoftwareReq: '#FF9800',
  HardwareReq: '#0EA5E9',
  TestCase: '#BA68C8',   // WCAG AA (was #9C27B0)
  InputSpec: '#a1887f',  // WCAG AA (was #795548)
  Komponente: '#78909c', // WCAG AA gray-blue
  Regel: '#A855F7',
}

// Background color (dark theme)
const BACKGROUND_COLOR = '#1e293b' // slate-800

/**
 * Calculate relative luminance per WCAG 2.1
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex)
  const [r, g, b] = rgb.map((c) => {
    const sRGB = c / 255
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Calculate contrast ratio per WCAG 2.1
 * https://www.w3.org/WAI/GL/wiki/Contrast_ratio
 */
function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getRelativeLuminance(hex1)
  const l2 = getRelativeLuminance(hex2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) throw new Error(`Invalid hex color: ${hex}`)
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ]
}

describe('WCAG AA Contrast Compliance', () => {
  // WCAG AA requires 4.5:1 for normal text, 3:1 for large text/UI components
  const MIN_CONTRAST_RATIO = 3.0 // UI components (nodes are large)

  Object.entries(NODE_COLORS).forEach(([nodeType, color]) => {
    it(`${nodeType} (${color}) has sufficient contrast against background`, () => {
      const ratio = getContrastRatio(color, BACKGROUND_COLOR)
      expect(ratio).toBeGreaterThanOrEqual(MIN_CONTRAST_RATIO)
    })
  })

  it('InputSpec meets WCAG AA (was #795548, now #a1887f)', () => {
    const ratio = getContrastRatio(NODE_COLORS.InputSpec, BACKGROUND_COLOR)
    // Must be at least 3:1 for UI components
    expect(ratio).toBeGreaterThanOrEqual(3.0)
    // Should be around 4.52:1 with the new color
    expect(ratio).toBeGreaterThan(4.0)
  })
})
