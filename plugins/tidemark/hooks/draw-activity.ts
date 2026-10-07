// The terminal's running-agent spinners: only this small region redraws, on one local clock; it reads no
// snapshot and never redraws the band.
import type { ClientModule } from 'claude-code'

import { FRAMES, FRAME_MS, SPINNERS } from './draw-spinner'

type Props = { count: number; color?: string; bg?: string }

const Spinner: ClientModule<Props, number> = (props, surface) => {
  if (surface.state === undefined) {
    surface.setState(0)
    surface.every(FRAME_MS, () => surface.setState(((surface.state ?? 0) + 1) % FRAMES.length))
  }
  return surface.elements.Text({
    ...(props.color !== undefined && { color: props.color }),
    ...(props.bg !== undefined && { backgroundColor: props.bg }),
    children: FRAMES[surface.state ?? 0]!.repeat(Math.min(props.count, SPINNERS)),
  })
}

export default Spinner
