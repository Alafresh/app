import { useCallback, useEffect, useRef } from 'react'
import { PALETTE, clamp, seeded, type GameProps } from '../lib/experience'
import { useAnimationFrame } from '../hooks/useAnimationFrame'
import { useCanvasResolution } from '../hooks/useCanvasResolution'

type Block = { x: number; y: number; width: number; color: string }

export function TowerStack({ paused, phase, onScore, onArtifact, playSound }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const size = useCanvasResolution(canvasRef)
  const blocksRef = useRef<Block[]>([])
  const movingRef = useRef({ x: 0, width: 170, direction: 1, speed: 190 })
  const scoreRef = useRef(0)
  const flashRef = useRef(0)
  const generatedTowersRef = useRef<Block[][]>([])
  const consequenceTimeRef = useRef(0)
  const soundPlayedRef = useRef<boolean[]>([false, false, false, false])

  useEffect(() => {
    const base = { x: size.width / 2 - 85, y: size.height - 42, width: 170, color: PALETTE[2] }
    blocksRef.current = [base]
    movingRef.current = { x: 30, width: 170, direction: 1, speed: 190 }
    scoreRef.current = 0
    generatedTowersRef.current = []
    consequenceTimeRef.current = 0
    soundPlayedRef.current = [false, false, false, false]
    onScore(0)
    onArtifact({ score: 0, label: 'VERTICAL AMBITION', seed: 101, values: [1, 170] })
  }, [size.width, size.height, onScore, onArtifact])

  // Generate 3 variations based on original tower geometry and palette
  useEffect(() => {
    if (phase === 'consequence' && generatedTowersRef.current.length === 0) {
      const original = blocksRef.current
      const towers: Block[][] = []
      for (let t = 1; t <= 3; t++) {
        const rng = seeded(101 + t * 997 + original.length * 17)
        const clone: Block[] = original.map((b, idx) => {
          // Keep base exact, vary upper blocks slightly (width +- 12%, position slight jitter)
          if (idx === 0) return { ...b }
          const wVar = 0.88 + rng() * 0.24
          const newWidth = Math.max(20, Math.min(180, b.width * wVar))
          const shift = (rng() - 0.5) * 16
          const colorIdx = (PALETTE.indexOf(b.color as typeof PALETTE[number]) + (rng() > 0.6 ? 1 : 0)) % 3
          return {
            x: b.x + shift,
            y: b.y,
            width: newWidth,
            color: colorIdx >= 0 ? PALETTE[colorIdx] : b.color,
          }
        })
        towers.push(clone)
      }
      generatedTowersRef.current = towers
    }
  }, [phase])

  const drop = useCallback(() => {
    if (paused || phase !== 'playing' || blocksRef.current.length === 0) return
    const blocks = blocksRef.current
    const previous = blocks[blocks.length - 1]
    const moving = movingRef.current
    const left = Math.max(moving.x, previous.x)
    const right = Math.min(moving.x + moving.width, previous.x + previous.width)
    const overlap = right - left
    if (overlap < 14) {
      moving.x = 20
      moving.direction = 1
      playSound('tap')
      return
    }
    const accuracy = overlap / previous.width
    const block = { x: left, y: previous.y - 31, width: overlap, color: PALETTE[blocks.length % 3] }
    blocks.push(block)
    scoreRef.current += 10 + Math.round(accuracy * 10)
    onScore(scoreRef.current)
    onArtifact({ score: scoreRef.current, label: `TOWER / ${blocks.length - 1} LEVELS`, seed: 101 + blocks.length, values: [blocks.length, overlap, accuracy] })
    moving.width = overlap
    moving.x = moving.direction > 0 ? 12 : size.width - overlap - 12
    moving.speed = Math.min(360, moving.speed + 9)
    flashRef.current = 1
    playSound(accuracy > 0.88 ? 'score' : 'tap')
  }, [paused, phase, size.width, onScore, onArtifact, playSound])

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault()
        drop()
      }
    }
    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [drop])

  useAnimationFrame((delta, time) => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    context.clearRect(0, 0, size.width, size.height)
    context.fillStyle = 'rgba(8,8,8,.38)'
    context.fillRect(0, 0, size.width, size.height)
    context.strokeStyle = 'rgba(217,255,63,.12)'
    context.lineWidth = 1
    for (let x = 0; x < size.width; x += 40) {
      context.beginPath(); context.moveTo(x, 0); context.lineTo(x, size.height); context.stroke()
    }

    if (phase === 'playing') {
      const moving = movingRef.current
      moving.x += moving.direction * moving.speed * delta
      if (moving.x < 10) { moving.x = 10; moving.direction = 1 }
      if (moving.x + moving.width > size.width - 10) { moving.x = size.width - moving.width - 10; moving.direction = -1 }
      flashRef.current = Math.max(0, flashRef.current - delta * 4)

      const blocks = blocksRef.current
      const camera = Math.max(0, (blocks.length - 8) * 31)
      blocks.forEach((block, index) => {
        const y = block.y + camera
        if (y < -40 || y > size.height + 40) return
        context.fillStyle = block.color
        context.fillRect(block.x, y, block.width, 27)
        context.fillStyle = 'rgba(8,8,8,.24)'
        context.fillRect(block.x, y + 20, block.width, 7)
        if (index === blocks.length - 1) {
          context.strokeStyle = '#fff'; context.strokeRect(block.x - 3, y - 3, block.width + 6, 33)
        }
      })
      const previous = blocks[blocks.length - 1]
      const movingY = clamp(previous.y - 100 + camera + Math.sin(time * 2) * 4, 50, size.height - 80)
      context.fillStyle = PALETTE[blocks.length % 3]
      context.fillRect(moving.x, movingY, moving.width, 27)
      context.fillStyle = `rgba(217,255,63,${flashRef.current * 0.18})`
      context.fillRect(0, 0, size.width, size.height)
      context.fillStyle = '#aaa'
      context.font = '12px "IBM Plex Mono"'
      context.fillText(`${blocks.length - 1} BLOCKS CERTIFIED`, 16, 24)
    } else {
      // Consequence or Reflection phase: 4 towers arranged horizontally
      consequenceTimeRef.current += delta
      const animTime = consequenceTimeRef.current
      const allTowers = [blocksRef.current, ...(generatedTowersRef.current || [])]
      const colWidth = size.width / 4

      // Calculate vertical scale so whole tower fits nicely
      const numBlocks = Math.max(1, blocksRef.current.length)
      const towerPixelHeight = numBlocks * 31
      const availableHeight = size.height - 120
      const scale = Math.min(0.68, availableHeight / Math.max(160, towerPixelHeight))

      allTowers.forEach((tower, tIndex) => {
        // Stagger reveal animation for towers 1, 2, 3
        const revealDelay = tIndex * 0.7
        if (animTime < revealDelay && tIndex > 0) return

        if (!soundPlayedRef.current[tIndex] && tIndex > 0) {
          soundPlayedRef.current[tIndex] = true
          playSound('tap')
        }

        const colCenterX = (tIndex + 0.5) * colWidth
        const baseBlock = tower[0] || { x: size.width / 2 - 85, width: 170 }
        const towerOrigCenterX = baseBlock.x + baseBlock.width / 2
        const baseY = size.height - 70

        // Entrance bounce
        const progress = Math.min(1, (animTime - revealDelay) / 0.5)
        const bounceY = tIndex === 0 ? 0 : (1 - progress) * -40
        const opacity = tIndex === 0 ? 1 : progress

        context.save()
        context.globalAlpha = opacity

        tower.forEach((block, bIndex) => {
          const relX = block.x - towerOrigCenterX
          const relY = block.y - (tower[0]?.y ?? (size.height - 42))

          const drawW = block.width * scale
          const drawH = 27 * scale
          const drawX = colCenterX + relX * scale - drawW / 2
          const drawY = baseY + relY * scale + bounceY

          context.fillStyle = block.color
          context.fillRect(drawX, drawY, drawW, drawH)
          context.fillStyle = 'rgba(8,8,8,.24)'
          context.fillRect(drawX, drawY + drawH * 0.7, drawW, drawH * 0.3)
          if (bIndex === tower.length - 1) {
            context.strokeStyle = '#fff'
            context.lineWidth = 1.5
            context.strokeRect(drawX - 2, drawY - 2, drawW + 4, drawH + 4)
          }
        })

        // Masterpiece badge
        const label = `MASTERPIECE #00${tIndex + 1}`
        context.font = '700 11px "IBM Plex Mono"'
        context.textAlign = 'center'
        const badgeWidth = Math.min(colWidth - 12, 130)
        const badgeY = size.height - 38

        context.fillStyle = tIndex === 0 ? '#D9FF3F' : 'rgba(255,255,255,0.85)'
        context.fillRect(colCenterX - badgeWidth / 2, badgeY - 14, badgeWidth, 22)
        context.fillStyle = '#080808'
        context.fillText(label, colCenterX, badgeY + 1)

        if (tIndex === 0) {
          context.font = '9px "IBM Plex Mono"'
          context.fillStyle = '#D9FF3F'
          context.fillText('[ORIGINAL]', colCenterX, badgeY - 20)
        }

        context.restore()
      })
    }
  }, paused)

  return (
    <div className="canvas-game">
      <canvas ref={canvasRef} onPointerDown={drop} aria-label="Tower stacking playfield" />
      {phase === 'playing' && (
        <button className="game-action" onClick={drop}>DROP BLOCK <kbd>SPACE</kbd></button>
      )}
    </div>
  )
}
