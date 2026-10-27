import { useEffect, useRef } from 'react'
import { PALETTE, type GameProps } from '../lib/experience'
import { useAnimationFrame } from '../hooks/useAnimationFrame'
import { useCanvasResolution } from '../hooks/useCanvasResolution'
import { useLanguage } from '../lib/i18n'

type Brick = {
  id: number
  x: number
  y: number
  width: number
  height: number
  alive: boolean
  color: string
}

const MAX_BLOCKS = 80

export function BreakEverything({ paused, phase, onScore, onArtifact, playSound }: GameProps) {
  const { t } = useLanguage()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const size = useCanvasResolution(canvasRef)
  const paddleRef = useRef({ x: 300, width: 110 })
  const ballRef = useRef({ x: 400, y: 300, vx: 220, vy: -250 })
  const bricksRef = useRef<Brick[]>([])
  const scoreRef = useRef(0)
  const brokenRef = useRef(0)
  const keysRef = useRef({ left: false, right: false })
  const initializedRef = useRef(false)
  const brickIdCounterRef = useRef(0)

  // Start with exactly FOUR blocks
  useEffect(() => {
    if (initializedRef.current || size.width < 50) return
    initializedRef.current = true

    const brickWidth = Math.min(130, Math.floor((size.width - 100) / 4))
    const gap = 12
    const totalWidth = 4 * brickWidth + 3 * gap
    const startX = (size.width - totalWidth) / 2

    const initialBricks: Brick[] = []
    for (let i = 0; i < 4; i++) {
      brickIdCounterRef.current += 1
      initialBricks.push({
        id: brickIdCounterRef.current,
        x: startX + i * (brickWidth + gap),
        y: 65,
        width: brickWidth,
        height: 26,
        alive: true,
        color: PALETTE[i % 3],
      })
    }
    bricksRef.current = initialBricks
    paddleRef.current.x = size.width / 2 - 55
    ballRef.current = { x: size.width / 2, y: size.height - 110, vx: 220, vy: -250 }
  }, [size.width, size.height])

  // Player controls
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (phase !== 'playing') return
      if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
        keysRef.current.left = true
        event.preventDefault()
      }
      if (event.code === 'ArrowRight' || event.code === 'KeyD') {
        keysRef.current.right = true
        event.preventDefault()
      }
    }
    const keyup = (event: KeyboardEvent) => {
      if (event.code === 'ArrowLeft' || event.code === 'KeyA') keysRef.current.left = false
      if (event.code === 'ArrowRight' || event.code === 'KeyD') keysRef.current.right = false
    }
    window.addEventListener('keydown', keydown)
    window.addEventListener('keyup', keyup)
    return () => {
      window.removeEventListener('keydown', keydown)
      window.removeEventListener('keyup', keyup)
    }
  }, [phase])

  // Helper to spawn replacement blocks in vacant positions
  const spawnReplacements = () => {
    const aliveBricks = bricksRef.current.filter((b) => b.alive)
    if (aliveBricks.length >= MAX_BLOCKS) return

    const cols = size.width < 550 ? 6 : 8
    const bWidth = (size.width - 40 - (cols - 1) * 6) / cols
    const bHeight = 22
    const maxRows = 7

    // Find unoccupied grid slots
    const occupied = new Set(
      aliveBricks.map((b) => `${Math.floor((b.x - 20) / (bWidth + 6))},${Math.floor((b.y - 45) / (bHeight + 6))}`)
    )

    const availableSlots: { col: number; row: number }[] = []
    for (let r = 0; r < maxRows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!occupied.has(`${c},${r}`)) {
          availableSlots.push({ col: c, row: r })
        }
      }
    }

    // Spawn up to 2 new blocks per destroyed block
    const toSpawn = Math.min(2, availableSlots.length, MAX_BLOCKS - aliveBricks.length)
    for (let s = 0; s < toSpawn; s++) {
      const pickIdx = Math.floor(Math.random() * availableSlots.length)
      const slot = availableSlots.splice(pickIdx, 1)[0]
      if (!slot) continue
      brickIdCounterRef.current += 1
      bricksRef.current.push({
        id: brickIdCounterRef.current,
        x: 20 + slot.col * (bWidth + 6),
        y: 45 + slot.row * (bHeight + 6),
        width: bWidth,
        height: bHeight,
        alive: true,
        color: PALETTE[brickIdCounterRef.current % 3],
      })
    }
  }

  useAnimationFrame((delta) => {
    const context = canvasRef.current?.getContext('2d')
    if (!context) return

    const paddle = paddleRef.current
    const ball = ballRef.current
    const isPlaying = phase === 'playing'
    const isAutopilot = phase === 'consequence' || phase === 'reflection'

    // Paddle Movement: manual during play, autonomous in post-game
    if (isPlaying) {
      if (keysRef.current.left) paddle.x -= 420 * delta
      if (keysRef.current.right) paddle.x += 420 * delta
    } else if (isAutopilot) {
      // Autopilot paddle tracks the ball cleanly
      const targetX = ball.x - paddle.width / 2
      paddle.x += (targetX - paddle.x) * Math.min(1, delta * 12)
    }
    paddle.x = Math.max(6, Math.min(size.width - paddle.width - 6, paddle.x))

    // Ball speed (accelerates in consequence phase to showcase proliferation)
    const speedMultiplier = isAutopilot ? 1.35 : 1
    ball.x += ball.vx * delta * speedMultiplier
    ball.y += ball.vy * delta * speedMultiplier

    // Side wall bounces
    if (ball.x < 10) {
      ball.vx = Math.abs(ball.vx)
      ball.x = 10
    } else if (ball.x > size.width - 10) {
      ball.vx = -Math.abs(ball.vx)
      ball.x = size.width - 10
    }

    // Top wall bounce
    if (ball.y < 10) {
      ball.vy = Math.abs(ball.vy)
    }

    // Bottom out: paddle saves in consequence, resets in play
    if (ball.y > size.height + 15) {
      ball.x = size.width / 2
      ball.y = size.height - 100
      ball.vx = 220
      ball.vy = -250
    }

    // Paddle bounce
    const paddleY = size.height - 36
    if (
      ball.vy > 0 &&
      ball.y + 8 > paddleY &&
      ball.y - 8 < paddleY + 14 &&
      ball.x > paddle.x - 6 &&
      ball.x < paddle.x + paddle.width + 6
    ) {
      ball.vy = -Math.abs(ball.vy)
      ball.vx += ((ball.x - (paddle.x + paddle.width / 2)) / paddle.width) * 110
      playSound('tap')
    }

    // Brick collisions & 1 -> 2 generation rule
    const aliveBricks = bricksRef.current.filter((b) => b.alive)
    aliveBricks.forEach((brick) => {
      if (
        ball.x + 8 > brick.x &&
        ball.x - 8 < brick.x + brick.width &&
        ball.y + 8 > brick.y &&
        ball.y - 8 < brick.y + brick.height
      ) {
        brick.alive = false
        ball.vy *= -1
        brokenRef.current += 1
        scoreRef.current += 10
        onScore(scoreRef.current)
        playSound('break')

        // DESTROY ONE -> SPAWN TWO NEW BLOCKS
        spawnReplacements()

        const currentAlive = bricksRef.current.filter((b) => b.alive).length
        onArtifact({
          score: scoreRef.current,
          label: `PROLIFERATION / ${currentAlive} BLOCKS`,
          seed: 606 + brokenRef.current,
          values: [brokenRef.current, currentAlive, MAX_BLOCKS],
        })
      }
    })

    // Draw frame
    context.clearRect(0, 0, size.width, size.height)
    context.fillStyle = 'rgba(8,8,8,.52)'
    context.fillRect(0, 0, size.width, size.height)

    // Draw active bricks
    const currentAliveCount = bricksRef.current.filter((b) => b.alive).length
    bricksRef.current.forEach((brick) => {
      if (!brick.alive) return
      context.fillStyle = brick.color
      context.fillRect(brick.x, brick.y, brick.width, brick.height)
      context.fillStyle = 'rgba(8,8,8,.25)'
      context.fillRect(brick.x, brick.y + brick.height - 4, brick.width, 4)
    })

    // Paddle
    context.fillStyle = '#fff'
    context.fillRect(paddle.x, paddleY, paddle.width, 10)

    // Ball
    context.fillStyle = '#D9FF3F'
    context.beginPath()
    context.arc(ball.x, ball.y, 8, 0, Math.PI * 2)
    context.fill()

    // Status overlay
    context.fillStyle = currentAliveCount >= MAX_BLOCKS ? '#F33DBA' : '#aaa'
    context.font = '12px "IBM Plex Mono"'
    const status =
      currentAliveCount >= MAX_BLOCKS
        ? t.gameplay.break.ceiling
        : `${t.gameplay.break.rule} / ${t.gameplay.break.active}: ${currentAliveCount} (${t.gameplay.break.broken}: ${brokenRef.current})`
    context.fillText(status, 14, 24)
  }, paused)

  return (
    <div className="canvas-game">
      <canvas
        ref={canvasRef}
        aria-label="Brick breaking multiplying playfield"
        onPointerMove={(event) => {
          if (phase !== 'playing') return
          const rect = event.currentTarget.getBoundingClientRect()
          paddleRef.current.x = Math.max(
            6,
            Math.min(size.width - paddleRef.current.width - 6, event.clientX - rect.left - paddleRef.current.width / 2)
          )
        }}
        onPointerDown={(event) => {
          if (phase !== 'playing') return
          const rect = event.currentTarget.getBoundingClientRect()
          paddleRef.current.x = event.clientX - rect.left - paddleRef.current.width / 2
        }}
      />
      {phase === 'playing' && (
        <div className="paddle-hint">{t.gameplay.break.hint}</div>
      )}
    </div>
  )
}
