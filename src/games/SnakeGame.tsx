import { useCallback, useEffect, useRef } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react'
import { PALETTE, seeded, type GameProps } from '../lib/experience'
import { useAnimationFrame } from '../hooks/useAnimationFrame'
import { useCanvasResolution } from '../hooks/useCanvasResolution'

type Point = { x: number; y: number }
const directions: Record<string, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

export function SnakeGame({ paused, phase, onScore, onArtifact, playSound }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const size = useCanvasResolution(canvasRef)
  const snakeRef = useRef<Point[]>([
    { x: 5, y: 5 },
    { x: 4, y: 5 },
    { x: 3, y: 5 },
  ])
  const directionRef = useRef<Point>(directions.right)
  const nextDirectionRef = useRef<Point>(directions.right)
  const foodsRef = useRef<Point[]>([{ x: 10, y: 7 }])
  const pendingGrowthRef = useRef(0)
  const scoreRef = useRef(0)
  const accumulatorRef = useRef(0)
  const touchRef = useRef<Point>({ x: 0, y: 0 })
  const randomRef = useRef(seeded(303))
  const consequenceTimeRef = useRef(0)
  const saturatedRef = useRef(false)

  const cell = Math.max(16, Math.min(26, Math.floor(size.width / 26)))
  const grid = {
    cell,
    columns: Math.max(12, Math.floor(size.width / cell)),
    rows: Math.max(10, Math.floor(size.height / cell)),
  }

  useEffect(() => {
    // Initial 3 foods for accelerated growth
    foodsRef.current = [
      { x: Math.floor(grid.columns * 0.4), y: Math.floor(grid.rows * 0.4) },
      { x: Math.floor(grid.columns * 0.7), y: Math.floor(grid.rows * 0.6) },
      { x: Math.floor(grid.columns * 0.2), y: Math.floor(grid.rows * 0.8) },
    ]
  }, [grid.columns, grid.rows])

  const turn = useCallback((name: keyof typeof directions) => {
    if (phase !== 'playing') return
    const next = directions[name]
    if (next.x + directionRef.current.x === 0 && next.y + directionRef.current.y === 0) return
    nextDirectionRef.current = next
  }, [phase])

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (phase !== 'playing') return
      const map: Record<string, keyof typeof directions> = {
        ArrowUp: 'up',
        KeyW: 'up',
        ArrowDown: 'down',
        KeyS: 'down',
        ArrowLeft: 'left',
        KeyA: 'left',
        ArrowRight: 'right',
        KeyD: 'right',
      }
      if (map[event.code]) {
        event.preventDefault()
        turn(map[event.code])
      }
    }
    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [phase, turn])

  useAnimationFrame((delta) => {
    const context = canvasRef.current?.getContext('2d')
    if (!context) return

    const totalCells = grid.columns * grid.rows
    const isPlaying = phase === 'playing'
    const isConsequence = phase === 'consequence' || phase === 'reflection'

    if (isConsequence) {
      consequenceTimeRef.current += delta
    }

    accumulatorRef.current += delta

    // Progressive speed acceleration: in consequence, speed ramps up aggressively
    const baseInterval = isPlaying
      ? Math.max(0.055, 0.11 - scoreRef.current * 0.0003)
      : Math.max(0.018, 0.08 - consequenceTimeRef.current * 0.02)

    if (accumulatorRef.current > baseInterval && !saturatedRef.current) {
      accumulatorRef.current = 0

      // In consequence mode: automated steering towards foods or open cells
      if (isConsequence) {
        const head = snakeRef.current[0]
        const occupied = new Set(snakeRef.current.map((p) => `${p.x},${p.y}`))
        const candidateDirections = [directions.right, directions.down, directions.left, directions.up]

        // Find nearest food or any open neighbor
        const targetFood = foodsRef.current[0] || { x: 0, y: 0 }
        let bestDir = directionRef.current
        let bestDist = Infinity

        for (const dir of candidateDirections) {
          // Cannot reverse directly
          if (dir.x + directionRef.current.x === 0 && dir.y + directionRef.current.y === 0) continue
          const nx = (head.x + dir.x + grid.columns) % grid.columns
          const ny = (head.y + dir.y + grid.rows) % grid.rows
          if (!occupied.has(`${nx},${ny}`)) {
            const dist = Math.hypot(nx - targetFood.x, ny - targetFood.y)
            if (dist < bestDist) {
              bestDist = dist
              bestDir = dir
            }
          }
        }

        // If no non-occupied neighbor found, or 85% full -> saturation reached
        if (bestDist === Infinity || snakeRef.current.length >= totalCells * 0.88) {
          saturatedRef.current = true
        } else {
          directionRef.current = bestDir
          nextDirectionRef.current = bestDir
        }
      } else {
        directionRef.current = nextDirectionRef.current
      }

      if (!saturatedRef.current) {
        const head = snakeRef.current[0]
        const next = {
          x: (head.x + directionRef.current.x + grid.columns) % grid.columns,
          y: (head.y + directionRef.current.y + grid.rows) % grid.rows,
        }

        // Self-collision: In play mode slices snake, in consequence mode treats as saturation constraint
        const hitsSelf = snakeRef.current.some((part) => part.x === next.x && part.y === next.y)
        if (hitsSelf) {
          if (isPlaying) {
            snakeRef.current = snakeRef.current.slice(0, Math.max(4, Math.floor(snakeRef.current.length * 0.6)))
          } else {
            // In consequence mode, hitting self when crammed means saturation lock
            if (snakeRef.current.length > totalCells * 0.5) {
              saturatedRef.current = true
            }
          }
        }

        snakeRef.current.unshift(next)

        // Check food consumption
        const foodIndex = foodsRef.current.findIndex((f) => f.x === next.x && f.y === next.y)
        if (foodIndex >= 0 || (isConsequence && Math.random() < 0.45)) {
          // Significant growth: 5-6 segments per food
          pendingGrowthRef.current += isPlaying ? 5 : 8
          scoreRef.current += 10
          onScore(scoreRef.current)
          onArtifact({
            score: scoreRef.current,
            label: `GROWTH / ${snakeRef.current.length} SEGMENTS`,
            seed: 303 + scoreRef.current,
            values: [snakeRef.current.length, scoreRef.current, grid.columns * grid.rows],
          })
          playSound('score')

          // Respawn eaten food
          const rng = randomRef.current
          if (foodIndex >= 0) {
            foodsRef.current[foodIndex] = {
              x: Math.floor(rng() * grid.columns),
              y: Math.floor(rng() * grid.rows),
            }
          }
          // In consequence, maintain 4-6 foods active simultaneously for hyper growth
          if (isConsequence && foodsRef.current.length < 5) {
            foodsRef.current.push({
              x: Math.floor(rng() * grid.columns),
              y: Math.floor(rng() * grid.rows),
            })
          }
        }

        if (pendingGrowthRef.current > 0) {
          pendingGrowthRef.current -= 1
        } else {
          snakeRef.current.pop()
        }
      }
    }

    // Camera zoom out as snake occupies more space
    const fillRatio = Math.min(1, snakeRef.current.length / totalCells)
    const zoom = isConsequence ? Math.max(0.65, 1 - fillRatio * 0.35) : 1

    context.save()
    context.clearRect(0, 0, size.width, size.height)
    context.fillStyle = 'rgba(8,8,8,.55)'
    context.fillRect(0, 0, size.width, size.height)

    // Apply zoom centered on canvas
    if (zoom < 1) {
      context.translate(size.width / 2, size.height / 2)
      context.scale(zoom, zoom)
      context.translate(-size.width / 2, -size.height / 2)
    }

    // Grid lines
    context.strokeStyle = 'rgba(255,255,255,.055)'
    context.lineWidth = 1
    for (let x = 0; x <= grid.columns; x += 1) {
      context.beginPath()
      context.moveTo(x * grid.cell, 0)
      context.lineTo(x * grid.cell, grid.rows * grid.cell)
      context.stroke()
    }
    for (let y = 0; y <= grid.rows; y += 1) {
      context.beginPath()
      context.moveTo(0, y * grid.cell)
      context.lineTo(grid.columns * grid.cell, y * grid.cell)
      context.stroke()
    }

    // Draw foods
    foodsRef.current.forEach((food) => {
      context.fillStyle = '#F33DBA'
      context.beginPath()
      context.arc((food.x + 0.5) * grid.cell, (food.y + 0.5) * grid.cell, grid.cell * 0.32, 0, Math.PI * 2)
      context.fill()
    })

    // Draw snake segments
    snakeRef.current.forEach((part, index) => {
      context.fillStyle = index === 0 ? '#FFFFFF' : PALETTE[index % 2]
      const inset = index === 0 ? 1 : 2
      context.fillRect(
        part.x * grid.cell + inset,
        part.y * grid.cell + inset,
        grid.cell - inset * 2,
        grid.cell - inset * 2
      )
    })

    context.restore()

    // HUD overlays
    context.fillStyle = isConsequence && fillRatio > 0.6 ? '#F33DBA' : '#aaa'
    context.font = '12px "IBM Plex Mono"'
    const freeSpace = Math.max(0, totalCells - snakeRef.current.length)
    const statusText = saturatedRef.current
      ? 'CRITICAL SATURATION REACHED / MOVEMENT IMPOSSIBLE'
      : isConsequence
      ? `EXPONENTIAL EXPANSION (${Math.round(fillRatio * 100)}% OCCUPIED)`
      : `AVAILABLE SPACE: ${freeSpace} (${Math.round(fillRatio * 100)}% DENSITY)`
    context.fillText(statusText, 14, 24)
  }, paused)

  return (
    <div className="canvas-game snake-game">
      <canvas
        ref={canvasRef}
        aria-label="Snake accelerated growth playfield"
        onPointerDown={(event) => {
          touchRef.current = { x: event.clientX, y: event.clientY }
        }}
        onPointerUp={(event) => {
          if (phase !== 'playing') return
          const dx = event.clientX - touchRef.current.x
          const dy = event.clientY - touchRef.current.y
          if (Math.abs(dx) + Math.abs(dy) < 12) return
          turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up')
        }}
      />
      {phase === 'playing' && (
        <div className="direction-pad" aria-label="Snake direction controls">
          <button onClick={() => turn('up')} aria-label="Move up"><ArrowUp /></button>
          <button onClick={() => turn('left')} aria-label="Move left"><ArrowLeft /></button>
          <button onClick={() => turn('down')} aria-label="Move down"><ArrowDown /></button>
          <button onClick={() => turn('right')} aria-label="Move right"><ArrowRight /></button>
        </div>
      )}
    </div>
  )
}
