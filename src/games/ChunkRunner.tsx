import { useCallback, useEffect, useRef } from 'react'
import { PALETTE, seeded, type GameProps } from '../lib/experience'
import { useAnimationFrame } from '../hooks/useAnimationFrame'
import { useCanvasResolution } from '../hooks/useCanvasResolution'
import { useLanguage } from '../lib/i18n'

type Obstacle = {
  id: number
  x: number
  height: number
  width: number
  type: 'ground' | 'overhead'
  hue: number
  cleared?: boolean
  hit?: boolean
}

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  life: number
}

export function ChunkRunner({ paused, phase, onScore, onArtifact, playSound }: GameProps) {
  const { t } = useLanguage()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const size = useCanvasResolution(canvasRef)
  const playerRef = useRef({
    y: 0,
    velocity: 0,
    isSliding: false,
    slideTime: 0,
    jumps: 0,
    slides: 0,
    hitCooldown: 0,
    stumble: 0,
  })
  const obstaclesRef = useRef<Obstacle[]>([])
  const particlesRef = useRef<Particle[]>([])
  const distanceRef = useRef(0)
  const scoreRef = useRef(0)
  const spawnRef = useRef(0.9)
  const obstacleIdRef = useRef(0)
  const randomRef = useRef(seeded(202))
  const flashRef = useRef(0)

  useEffect(() => {
    playerRef.current = {
      y: 0,
      velocity: 0,
      isSliding: false,
      slideTime: 0,
      jumps: 0,
      slides: 0,
      hitCooldown: 0,
      stumble: 0,
    }
    obstaclesRef.current = []
    particlesRef.current = []
    distanceRef.current = 0
    scoreRef.current = 0
    spawnRef.current = 0.9
    obstacleIdRef.current = 0
    flashRef.current = 0
    onScore(0)
    onArtifact({ score: 0, label: 'RUNNER INITIATED', seed: 202, values: [0, 0, 0] })
  }, [onScore, onArtifact])

  const jump = useCallback(() => {
    if (paused || phase !== 'playing') return
    const player = playerRef.current
    if (player.y <= 1 && !player.isSliding) {
      player.velocity = 560
      player.jumps += 1
      playSound('jump')
    }
  }, [paused, phase, playSound])

  const slide = useCallback(() => {
    if (paused || phase !== 'playing') return
    const player = playerRef.current
    if (player.y <= 2) {
      player.isSliding = true
      player.slideTime = 0.55 // slide duration in seconds
      player.slides += 1
      playSound('tap')
    }
  }, [paused, phase, playSound])

  // Keyboard controls: Up/Space to jump, Down/S to slide
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') {
        event.preventDefault()
        jump()
      } else if (event.code === 'ArrowDown' || event.code === 'KeyS') {
        event.preventDefault()
        slide()
      }
    }
    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [jump, slide])

  useAnimationFrame((delta, time) => {
    const context = canvasRef.current?.getContext('2d')
    if (!context) return

    const ground = size.height - 68
    const player = playerRef.current
    const isPlaying = phase === 'playing'
    const isAutopilot = phase === 'consequence' || phase === 'reflection'

    // Ground speed
    const baseSpeed = 240 + Math.min(100, distanceRef.current * 0.05)
    const currentSpeed = player.stumble > 0 ? baseSpeed * 0.45 : baseSpeed
    distanceRef.current += delta * currentSpeed * 0.1

    // Physics
    if (player.isSliding) {
      player.slideTime -= delta
      if (player.slideTime <= 0) {
        player.isSliding = false
      }
    } else {
      player.velocity -= 1350 * delta
      player.y = Math.max(0, player.y + player.velocity * delta)
      if (player.y === 0) player.velocity = 0
    }

    if (player.stumble > 0) player.stumble = Math.max(0, player.stumble - delta)
    if (player.hitCooldown > 0) player.hitCooldown = Math.max(0, player.hitCooldown - delta)
    flashRef.current = Math.max(0, flashRef.current - delta * 3)

    // Obstacle Spawning
    spawnRef.current -= delta
    if (spawnRef.current <= 0) {
      const rng = randomRef.current
      const isOverhead = rng() > 0.65
      obstacleIdRef.current += 1

      if (isOverhead) {
        // Overhead obstacle: requires sliding
        obstaclesRef.current.push({
          id: obstacleIdRef.current,
          x: size.width + 40,
          height: 38,
          width: 38 + rng() * 30,
          type: 'overhead',
          hue: 1, // Magenta
        })
      } else {
        // Ground obstacle: requires jumping
        obstaclesRef.current.push({
          id: obstacleIdRef.current,
          x: size.width + 40,
          height: 28 + rng() * 32,
          width: 24 + rng() * 22,
          type: 'ground',
          hue: 0, // Lime
        })
      }
      spawnRef.current = 0.95 + rng() * 0.9
    }

    // Move obstacles
    obstaclesRef.current.forEach((obstacle) => {
      obstacle.x -= currentSpeed * delta
    })

    const playerX = Math.max(65, size.width * 0.18)
    const playerWidth = player.isSliding ? 40 : 28
    const playerHeight = player.isSliding ? 14 : 30
    const playerTop = ground - player.y - playerHeight
    const playerBottom = ground - player.y

    // AUTOPILOT in post-game consequence phase:
    // Automatically predicts and clears incoming obstacles with laser perfection!
    if (isAutopilot) {
      const nearestAhead = obstaclesRef.current.find(
        (o) => o.x > playerX && o.x < playerX + 160 && !o.cleared
      )
      if (nearestAhead) {
        if (nearestAhead.type === 'ground' && player.y <= 1 && !player.isSliding) {
          player.velocity = 560
          playSound('jump')
        } else if (nearestAhead.type === 'overhead' && player.y <= 2 && !player.isSliding) {
          player.isSliding = true
          player.slideTime = 0.6
          playSound('tap')
        }
      }
    }

    // Collision & clearance detection
    obstaclesRef.current.forEach((obstacle) => {
      let obsTop: number
      let obsBottom: number

      if (obstacle.type === 'ground') {
        obsTop = ground - obstacle.height
        obsBottom = ground
      } else {
        // Overhead barrier floats above sliding height
        obsTop = ground - 64
        obsBottom = ground - 22
      }

      const xOverlap = playerX + playerWidth > obstacle.x && playerX < obstacle.x + obstacle.width
      const yOverlap = playerTop < obsBottom && playerBottom > obsTop

      if (xOverlap && yOverlap && !obstacle.hit) {
        obstacle.hit = true
        if (isPlaying && player.hitCooldown <= 0) {
          // Player collision feedback
          player.hitCooldown = 0.8
          player.stumble = 0.5
          flashRef.current = 1
          playSound('break')

          // Particle burst
          for (let p = 0; p < 12; p++) {
            const angle = Math.random() * Math.PI * 2
            const speed = 60 + Math.random() * 140
            particlesRef.current.push({
              x: playerX + 15,
              y: ground - player.y - 15,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed - 60,
              color: '#F33DBA',
              life: 0.6,
            })
          }
        }
      }

      // Check clearance
      if (!obstacle.cleared && obstacle.x + obstacle.width < playerX) {
        obstacle.cleared = true
        if (!obstacle.hit && isPlaying) {
          scoreRef.current += 15
          onScore(scoreRef.current)
          onArtifact({
            score: scoreRef.current,
            label: `RUNNER / ${scoreRef.current} PTS`,
            seed: 202 + scoreRef.current,
            values: [scoreRef.current, player.jumps, player.slides],
          })
        }
      }
    })

    // Filter offscreen obstacles
    obstaclesRef.current = obstaclesRef.current.filter((o) => o.x > -100)

    // Update particles
    particlesRef.current.forEach((p) => {
      p.x += p.vx * delta
      p.y += p.vy * delta
      p.life -= delta * 1.8
    })
    particlesRef.current = particlesRef.current.filter((p) => p.life > 0)

    // Draw background
    context.clearRect(0, 0, size.width, size.height)
    context.fillStyle = 'rgba(8,8,8,.45)'
    context.fillRect(0, 0, size.width, size.height)

    // Flash overlay on hit
    if (flashRef.current > 0) {
      context.fillStyle = `rgba(243,61,186,${flashRef.current * 0.28})`
      context.fillRect(0, 0, size.width, size.height)
    }

    // Grid lines / perspective track
    context.strokeStyle = 'rgba(255,255,255,.12)'
    for (let i = 0; i < 14; i += 1) {
      const x = (((i * 120 - distanceRef.current * 9) % (size.width + 120)) + (size.width + 120)) % (size.width + 120) - 40
      context.beginPath()
      context.moveTo(x, ground)
      context.lineTo(x + 70, ground - 80)
      context.stroke()
    }

    // Ground plane
    context.strokeStyle = '#D9FF3F'
    context.lineWidth = 2
    context.beginPath()
    context.moveTo(0, ground + 1)
    context.lineTo(size.width, ground + 1)
    context.stroke()

    // Draw obstacles
    obstaclesRef.current.forEach((obstacle) => {
      if (obstacle.type === 'ground') {
        context.fillStyle = obstacle.hit ? 'rgba(243,61,186,0.6)' : PALETTE[obstacle.hue]
        context.fillRect(obstacle.x, ground - obstacle.height, obstacle.width, obstacle.height)
        context.fillStyle = '#080808'
        context.fillRect(obstacle.x + 4, ground - obstacle.height + 6, Math.max(3, obstacle.width - 8), 3)
      } else {
        // Overhead hazard
        const yPos = ground - 64
        context.fillStyle = obstacle.hit ? 'rgba(243,61,186,0.6)' : '#F33DBA'
        context.fillRect(obstacle.x, yPos, obstacle.width, 42)
        // Danger stripes
        context.fillStyle = '#080808'
        for (let s = 0; s < obstacle.width; s += 10) {
          context.fillRect(obstacle.x + s, yPos, 4, 42)
        }
      }
    })

    // Draw particles
    particlesRef.current.forEach((p) => {
      context.fillStyle = p.color
      context.globalAlpha = Math.max(0, p.life)
      context.fillRect(p.x, p.y, 4, 4)
      context.globalAlpha = 1
    })

    // Draw player
    const bob = player.y === 0 && !player.isSliding ? Math.sin(time * 18) * 2 : 0
    const isFlicker = player.hitCooldown > 0 && Math.floor(time * 24) % 2 === 0

    if (!isFlicker) {
      context.save()
      if (player.isSliding) {
        // Sliding posture: low horizontal block
        context.translate(playerX + 20, ground - 8)
        context.fillStyle = '#D9FF3F'
        context.fillRect(-20, -7, 40, 14)
        context.fillStyle = '#080808'
        context.fillRect(10, -5, 5, 5)
        // Slide dust
        context.fillStyle = 'rgba(217,255,63,.4)'
        context.fillRect(-26, 3, 10, 3)
      } else {
        // Normal / Jumping runner
        context.translate(playerX + 14, ground - 16 - player.y + bob)
        if (player.y > 0) {
          context.rotate(distanceRef.current * 0.05)
        }
        context.fillStyle = player.stumble > 0 ? '#F33DBA' : '#D9FF3F'
        context.fillRect(-14, -14, 28, 28)
        context.fillStyle = '#080808'
        context.fillRect(4, -6, 5, 5)
      }
      context.restore()
    }

    // Autopilot targeting ray visualization in post-game
    if (isAutopilot) {
      context.save()
      context.strokeStyle = 'rgba(85,221,224,0.7)'
      context.setLineDash([4, 4])
      context.lineWidth = 1.5
      context.beginPath()
      context.moveTo(playerX + 20, ground - player.y - 15)
      context.lineTo(playerX + 160, ground - 30)
      context.stroke()

      // Autopilot banner
      context.font = '700 12px "IBM Plex Mono"'
      context.fillStyle = '#55DDE0'
      context.fillText(t.gameplay.runner.autopilot, 16, 50)
      context.restore()
    }

    // HUD Stats
    context.fillStyle = '#aaa'
    context.font = '12px "IBM Plex Mono"'
    context.fillText(
      `${t.gameplay.runner.distance}: ${String(Math.floor(distanceRef.current)).padStart(4, '0')}m   ${t.gameplay.runner.avoided}: ${scoreRef.current / 15}`,
      16,
      24
    )
  }, paused)

  return (
    <div className="canvas-game">
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const relativeY = e.clientY - rect.top
          if (relativeY > rect.height * 0.6) {
            slide()
          } else {
            jump()
          }
        }}
        aria-label="Active runner playfield with jumping and sliding"
      />
      {phase === 'playing' && (
        <div style={{ position: 'absolute', right: 14, bottom: 14, display: 'flex', gap: 8 }}>
          <button className="game-action" onClick={slide} style={{ position: 'static' }}>
            {t.gameplay.runner.slide} <kbd>↓ / S</kbd>
          </button>
          <button className="game-action" onClick={jump} style={{ position: 'static' }}>
            {t.gameplay.runner.jump} <kbd>SPACE / ↑</kbd>
          </button>
        </div>
      )}
    </div>
  )
}
