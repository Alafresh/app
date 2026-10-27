export const PALETTE = ['#D9FF3F', '#F33DBA', '#FFFFFF', '#55DDE0'] as const

export type GameResult = {
  score: number
  label: string
  seed: number
  values: number[]
  colors?: string[]
}

export type Artifact = GameResult & {
  game: number
  title: string
  id: string
}

export type GameProps = {
  paused: boolean
  onScore: (score: number) => void
  onArtifact: (result: GameResult) => void
  playSound: (name: SoundName) => void
}

export type SoundName = 'tap' | 'score' | 'jump' | 'break' | 'shot' | 'success' | 'combine'

export const GAME_META = [
  { title: 'TOWER STACK', short: 'STACK', instruction: 'Click, tap, or press SPACE to drop each moving block.', success: 'INCREDIBLE!' },
  { title: 'CHUNK RUNNER', short: 'RUN', instruction: 'Click, tap, or press SPACE to jump over the obstacles.', success: 'ANOTHER MASTERPIECE!' },
  { title: 'SNAKE: MORE, MORE, MORE', short: 'GROW', instruction: 'Use arrows, WASD, swipe, or the direction pad to collect.', success: 'YOU ARE A NATURAL!' },
  { title: 'ONE CHOICE', short: 'CHOOSE', instruction: 'Aim with your pointer, then click once — or press SPACE.', success: 'CREATIVITY LEVEL: EXCEPTIONAL!' },
  { title: 'COLOR FACTORY', short: 'COMPOSE', instruction: 'Choose a color and shape, then click the canvas to compose.', success: 'A SIGNATURE STYLE IS BORN!' },
  { title: 'BREAK EVERYTHING', short: 'BREAK', instruction: 'Move the paddle with your pointer, arrows, or touch.', success: 'UNSTOPPABLE OUTPUT!' },
  { title: 'COPY PASTE', short: 'MATCH', instruction: 'Turn over two cards and find the matching originals.', success: 'REMARKABLY ORIGINAL!' },
  { title: 'MASHUP', short: 'CONNECT', instruction: 'Select two unlike ideas, then combine them into something new.', success: 'A NEW POSSIBILITY EXISTS!' },
] as const

export const PRAISE_LINES = [
  'A singular vision. Certified by the engine.',
  'Your avoidance skills are genuinely breathtaking.',
  'Growth looks good on you. More is more.',
  'One decision. Infinite personal branding potential.',
  'This exact style is now trending for 8,492 others.',
  'You destroyed 24 blocks. The system made 48 more.',
  'Every unique creation matches another unique creation.',
  'You made the connection. That part was yours.',
]

export function seeded(seed: number) {
  let value = seed >>> 0
  return () => {
    value += 0x6d2b79f5
    let t = value
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashString(value: string) {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}
