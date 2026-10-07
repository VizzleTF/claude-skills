// The running-agent spinner: an eight-dot braille cell with five lit dots moving clockwise, one frame per
// FRAME_MS. The terminal's Client and the desktop's Svg draw the same frames (after ccOverhead).
const CLOCKWISE = [0, 3, 4, 5, 7, 6, 2, 1]
const MASKS = CLOCKWISE.map((_, phase) => [0, 1, 2, 3, 4].reduce((m, k) => m | (1 << CLOCKWISE[(phase + k) % 8]!), 0))
export const FRAMES = MASKS.map(mask => String.fromCharCode(0x2800 + mask))
export const FRAME_MS = 140
export const SPINNERS = 3

// `count` spinners as script-free SVG: each dot's opacity steps with the frames; still under reduced motion.
export function spinnerSvg(count: number, fill: { dark: string; light: string }): { source: string; alt: string; width: number; height: number; isInteractive: true } {
  const n = Math.min(count, SPINNERS)
  const width = n * 10 - 2
  const dots = [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [0, 3], [1, 3]] as const
  const times = MASKS.map((_, i) => i / MASKS.length).concat(1).join(';')
  const draw = (animated: boolean) => Array.from({ length: n }, (_, i) => dots.map(([x, y], bit) => {
    const values = MASKS.map(mask => (mask & (1 << bit) ? 1 : 0.12))
    const motion = animated
      ? `<animate attributeName="opacity" values="${[...values, values[0]].join(';')}" keyTimes="${times}" calcMode="discrete" dur="${FRAME_MS * MASKS.length}ms" repeatCount="indefinite"/>`
      : ''
    return `<circle cx="${2 + i * 10 + x * 4}" cy="${1.5 + (y * 11) / 3}" r="1.15" opacity="${values[0]}">${motion}</circle>`
  }).join('')).join('')
  const style = `<style>.k{fill:${fill.dark}}@media (prefers-color-scheme: light){.k{fill:${fill.light}}}.still{display:none}@media (prefers-reduced-motion: reduce){.moving{display:none}.still{display:inline}}</style>`
  const source = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="14" viewBox="0 0 ${width} 14">${style}<g class="k moving">${draw(true)}</g><g class="k still">${draw(false)}</g></svg>`
  return { source, alt: `${count} running agents`, width, height: 14, isInteractive: true }
}
