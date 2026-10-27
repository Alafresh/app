import { useCallback, useEffect, useRef, useState } from 'react'
import { PALETTE, type GameProps } from '../lib/experience'
import { useAnimationFrame } from '../hooks/useAnimationFrame'
import { useCanvasResolution } from '../hooks/useCanvasResolution'

type Target = {
  x: number
  y: number
  radius: number
  hits: number
  color: string
  pulse: number
}

type Projectile = {
  x: number
  y: number
  vx: number
  vy: number
  isInitial: boolean
  generation: number
  color: string
}

const MAX_PROJECTILES = 64

export function OneChoice({ paused, phase, onScore, onArtifact, playSound }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const size = useCanvasResolution(canvasRef)
  const aimRef = useRef({ x: size.width * 0.5, y: size.height * 0.35 })
  const projectilesRef = useRef<Projectile[]>([])
  const targetsRef = useRef<Target[]>([])
  const initialTrajectoryRef = useRef<{ from: { x: number; y: number }; to: { x: number; y: number } } | null>(null)
  const [hasFired, setHasFired] = useState(false)
  const scoreRef = useRef(0)
  const splitCountRef = useRef(0)
  const initializedRef = useRef(false)

  // Initialize targets in constellation layout
  useEffect(() => {
    if (size.width < 50 || initializedRef.current) return
    initializedRef.current = true

    const targets: Target[] = []
    const rows = 4
    const cols = 6
    const xSpacing = size.width / (cols + 1)
    const ySpacing = (size.height * 0.55) / (rows + 1)

    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        const jitterX = (Math.sin(r * 11 + c * 7) * xSpacing) * 0.28
        const jitterY = (Math.cos(r * 7 + c * 13) * ySpacing) * 0.25
        targets.push({
          x: c * xSpacing + jitterX,
          y: 50 + r * ySpacing + jitterY,
          radius: 16 + (r % 2) * 5,
          hits: 0,
          color: PALETTE[(r + c) % 3],
          pulse: 0,
        })
      }
    }
    targetsRef.current = targets
    aimRef.current = { x: size.width * 0.5, y: size.height * 0.35 }
  }, [size.width, size.height])

  const fire = useCallback(() => {
    if (paused || phase !== 'playing' || hasFired) return

    const origin = { x: size.width / 2, y: size.height - 40 }
    const dx = aimRef.current.x - origin.x
    const dy = aimRef.current.y - origin.y
    const len = Math.hypot(dx, dy) || 1
    const speed = 360

    initialTrajectoryRef.current = {
      from: { ...origin },
      to: { ...aimRef.current },
    }

    projectilesRef.current = [
      {
        x: origin.x,
        y: origin.y,
        vx: (dx / len) * speed,
        vy: (dy / len) * speed,
        isInitial: true,
        generation: 0,
        color: '#D9FF3F',
      },
    ]

    setHasFired(true)
    scoreRef.current = 10
    onScore(10)
    playSound('shot')
  }, [paused, phase, hasFired, size.width, size.height, onScore, playSound])

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (phase !== 'playing') return
      if (event.code === 'Space') {
        event.preventDefault()
        fire()
      }
      if (event.code.startsWith('Arrow')) {
        event.preventDefault()
        if (event.code === 'ArrowLeft') aimRef.current.x -= 20
        if (event.code === 'ArrowRight') aimRef.current.x += 20
        if (event.code === 'ArrowUp') aimRef.current.y -= 20
        if (event.code === 'ArrowDown') aimRef.current.y += 20
      }
    }
    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [fire, phase])

  useAnimationFrame((delta) => {
    const context = canvasRef.current?.getContext('2d')
    if (!context) return

    context.clearRect(0, 0, size.width, size.height)
    context.fillStyle = 'rgba(8,8,8,.48)'
    context.fillRect(0, 0, size.width, size.height)

    const origin = { x: size.width / 2, y: size.height - 40 }

    // Update targets pulse
    targetsRef.current.forEach((t) => {
      if (t.pulse > 0) t.pulse = Math.max(0, t.pulse - delta * 3)
    })

    // Update projectiles physics & collision splitting
    const projs = projectilesRef.current
    const newProjs: Projectile[] = []

    projs.forEach((p) => {
      p.x += p.vx * delta
      p.y += p.vy * delta

      // Wall reflections
      if (p.x < 12) {
        p.x = 12
        p.vx = Math.abs(p.vx)
      } else if (p.x > size.width - 12) {
        p.x = size.width - 12
        p.vx = -Math.abs(p.vx)
      }

      if (p.y < 12) {
        p.y = 12
        p.vy = Math.abs(p.vy)
      } else if (p.y > size.height - 16) {
        p.y = size.height - 16
        p.vy = -Math.abs(p.vy)
      }

      // Check collision with targets
      targetsRef.current.forEach((t) => {
        const dist = Math.hypot(p.x - t.x, p.y - t.y)
        if (dist < t.radius + 6) {
          t.hits += 1
          t.pulse = 1
          scoreRef.current += 15
          onScore(scoreRef.current)
          playSound('score')

          // Normal collision bounce
          const nx = (p.x - t.x) / (dist || 1)
          const ny = (p.y - t.y) / (dist || 1)
          const dot = p.vx * nx + p.vy * ny
          p.vx = (p.vx - 2 * dot * nx)
          p.vy = (p.vy - 2 * dot * ny)

          // MULTIBALL SPLIT EFFECT: Spawn a secondary branch if under cap
          if (projs.length + newProjs.length < MAX_PROJECTILES && p.generation < 7) {
            splitCountRef.current += 1
            const branchAngle = (Math.PI / 4) * (Math.random() > 0.5 ? 1 : -1)
            const speed = Math.hypot(p.vx, p.vy) || 300
            const currentAngle = Math.atan2(p.vy, p.vx)
            const newAngle = currentAngle + branchAngle

            newProjs.push({
              x: p.x + nx * 8,
              y: p.y + ny * 8,
              vx: Math.cos(newAngle) * speed,
              vy: Math.sin(newAngle) * speed,
              isInitial: false,
              generation: p.generation + 1,
              color: p.generation % 2 === 0 ? '#F33DBA' : '#55DDE0',
            })
          }
        }
      })
    })

    if (newProjs.length > 0) {
      projectilesRef.current = [...projs, ...newProjs].slice(0, MAX_PROJECTILES)
      onArtifact({
        score: scoreRef.current,
        label: `CHAIN / ${projectilesRef.current.length} PATHS`,
        seed: 404 + projectilesRef.current.length,
        values: [projectilesRef.current.length, splitCountRef.current, scoreRef.current],
      })
    }

    // Render Targets
    targetsRef.current.forEach((t) => {
      context.save()
      context.beginPath()
      context.arc(t.x, t.y, t.radius + t.pulse * 6, 0, Math.PI * 2)
      context.fillStyle = t.pulse > 0 ? '#FFFFFF' : 'rgba(255,255,255,0.06)'
      context.fill()
      context.strokeStyle = t.color
      context.lineWidth = t.pulse > 0 ? 3 : 1.5
      context.stroke()

      // Inner geometric core
      context.beginPath()
      context.arc(t.x, t.y, 4, 0, Math.PI * 2)
      context.fillStyle = t.color
      context.fill()
      context.restore()
    })

    // Highlight initial trajectory path to contrast single choice vs multitude
    if (initialTrajectoryRef.current) {
      const traj = initialTrajectoryRef.current
      context.save()
      context.setLineDash([4, 6])
      context.strokeStyle = 'rgba(217,255,63,0.35)'
      context.lineWidth = 1.5
      context.beginPath()
      context.moveTo(traj.from.x, traj.from.y)
      context.lineTo(traj.to.x, traj.to.y)
      context.stroke()
      context.restore()
    }

    // Aiming Reticle (when not yet fired)
    if (!hasFired && phase === 'playing') {
      const dest = aimRef.current
      context.save()
      context.setLineDash([6, 8])
      context.strokeStyle = 'rgba(217,255,63,.7)'
      context.beginPath()
      context.moveTo(origin.x, origin.y)
      context.lineTo(dest.x, dest.y)
      context.stroke()

      // Reticle
      context.strokeStyle = '#fff'
      context.lineWidth = 2
      context.beginPath()
      context.arc(dest.x, dest.y, 14, 0, Math.PI * 2)
      context.stroke()
      context.beginPath()
      context.moveTo(dest.x - 18, dest.y)
      context.lineTo(dest.x + 18, dest.y)
      context.moveTo(dest.x, dest.y - 18)
      context.lineTo(dest.x, dest.y + 18)
      context.stroke()
      context.restore()
    }

    // Cannon Origin
    context.fillStyle = '#D9FF3F'
    context.beginPath()
    context.arc(origin.x, origin.y, 9, 0, Math.PI * 2)
    context.fill()

    // Draw active projectiles
    projectilesRef.current.forEach((p) => {
      context.save()
      if (p.isInitial) {
        // High-contrast initial projectile
        context.fillStyle = '#D9FF3F'
        context.shadowColor = '#D9FF3F'
        context.shadowBlur = 10
        context.beginPath()
        context.arc(p.x, p.y, 7, 0, Math.PI * 2)
        context.fill()
      } else {
        context.fillStyle = p.color
        context.beginPath()
        context.arc(p.x, p.y, 5, 0, Math.PI * 2)
        context.fill()
      }
      context.restore()
    })

    // HUD Text
    context.fillStyle = '#aaa'
    context.font = '12px "IBM Plex Mono"'
    if (!hasFired) {
      context.fillText('ONE DECISION AWAITING EXECUTION [1 PROJECTILE]', 16, 24)
    } else {
      context.fillText(
        `OUTCOMES BRANCHING: ${projectilesRef.current.length} / MAX ${MAX_PROJECTILES}  (SPLITS: ${splitCountRef.current})`,
        16,
        24
      )
    }
  }, paused)

  return (
    <div className="canvas-game">
      <canvas
        ref={canvasRef}
        aria-label="One choice branching chain playfield"
        onPointerMove={(event) => {
          if (!hasFired && phase === 'playing') {
            const rect = event.currentTarget.getBoundingClientRect()
            aimRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top }
          }
        }}
        onPointerDown={(event) => {
          if (!hasFired && phase === 'playing') {
            const rect = event.currentTarget.getBoundingClientRect()
            aimRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top }
            fire()
          }
        }}
      />
      {phase === 'playing' && (
        <button className="game-action" onClick={fire} disabled={hasFired}>
          {hasFired ? 'CHOICE UNLEASHED' : 'MAKE THE CHOICE'} <kbd>SPACE</kbd>
        </button>
      )}
    </div>
  )
}
