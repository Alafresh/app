import { useEffect, useRef } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react'
import { PALETTE, seeded, type GameProps } from '../lib/experience'
import { useAnimationFrame } from '../hooks/useAnimationFrame'
import { useCanvasResolution } from '../hooks/useCanvasResolution'

type Point = { x: number; y: number }
const directions: Record<string, Point> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } }

export function SnakeGame({ paused, onScore, onArtifact, playSound }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const size = useCanvasResolution(canvasRef)
  const snakeRef = useRef<Point[]>([{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }])
  const directionRef = useRef<Point>(directions.right)
  const nextDirectionRef = useRef<Point>(directions.right)
  const foodRef = useRef<Point>({ x: 10, y: 7 })
  const scoreRef = useRef(0)
  const accumulatorRef = useRef(0)
  const touchRef = useRef<Point>({ x: 0, y: 0 })
  const randomRef = useRef(seeded(303))
  const cell = Math.max(16, Math.min(28, Math.floor(size.width / 25)))
  const grid = {
    cell,
    columns: Math.max(10, Math.floor(size.width / cell)),
    rows: Math.max(8, Math.floor(size.height / cell)),
  }

  useEffect(() => {
    foodRef.current = { x: Math.floor(grid.columns * 0.65), y: Math.floor(grid.rows * 0.45) }
  }, [grid.columns, grid.rows])

  const turn = (name: keyof typeof directions) => {
    const next = directions[name]
    if (next.x + directionRef.current.x === 0 && next.y + directionRef.current.y === 0) return
    nextDirectionRef.current = next
  }

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      const map: Record<string, keyof typeof directions> = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' }
      if (map[event.code]) { event.preventDefault(); turn(map[event.code]) }
    }
    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [])

  useAnimationFrame((delta) => {
    const context = canvasRef.current?.getContext('2d')
    if (!context) return
    accumulatorRef.current += delta
    if (accumulatorRef.current > Math.max(0.065, 0.13 - scoreRef.current * 0.0006)) {
      accumulatorRef.current = 0
      directionRef.current = nextDirectionRef.current
      const head = snakeRef.current[0]
      const next = {
        x: (head.x + directionRef.current.x + grid.columns) % grid.columns,
        y: (head.y + directionRef.current.y + grid.rows) % grid.rows,
      }
      if (snakeRef.current.some((part) => part.x === next.x && part.y === next.y)) {
        snakeRef.current = snakeRef.current.slice(0, 4)
      }
      snakeRef.current.unshift(next)
      if (next.x === foodRef.current.x && next.y === foodRef.current.y) {
        scoreRef.current += 10
        onScore(scoreRef.current)
        onArtifact({ score: scoreRef.current, label: `GROWTH / ${snakeRef.current.length} UNITS`, seed: 303 + scoreRef.current, values: [snakeRef.current.length, scoreRef.current, grid.columns] })
        playSound('score')
        const random = randomRef.current
        foodRef.current = { x: Math.floor(random() * grid.columns), y: Math.floor(random() * grid.rows) }
      } else {
        snakeRef.current.pop()
      }
    }
    context.clearRect(0, 0, size.width, size.height)
    context.fillStyle = 'rgba(8,8,8,.55)'; context.fillRect(0, 0, size.width, size.height)
    context.strokeStyle = 'rgba(255,255,255,.055)'; context.lineWidth = 1
    for (let x = 0; x <= grid.columns; x += 1) { context.beginPath(); context.moveTo(x * grid.cell, 0); context.lineTo(x * grid.cell, grid.rows * grid.cell); context.stroke() }
    for (let y = 0; y <= grid.rows; y += 1) { context.beginPath(); context.moveTo(0, y * grid.cell); context.lineTo(grid.columns * grid.cell, y * grid.cell); context.stroke() }
    context.fillStyle = '#F33DBA'
    context.beginPath(); context.arc((foodRef.current.x + 0.5) * grid.cell, (foodRef.current.y + 0.5) * grid.cell, grid.cell * 0.3, 0, Math.PI * 2); context.fill()
    snakeRef.current.forEach((part, index) => {
      context.fillStyle = index === 0 ? '#FFFFFF' : PALETTE[index % 2]
      const inset = index === 0 ? 2 : 3
      context.fillRect(part.x * grid.cell + inset, part.y * grid.cell + inset, grid.cell - inset * 2, grid.cell - inset * 2)
    })
    context.fillStyle = '#aaa'; context.font = '12px "IBM Plex Mono"'
    context.fillText(`AVAILABLE SPACE ${Math.max(0, grid.columns * grid.rows - snakeRef.current.length)}`, 12, 20)
  }, paused)

  return (
    <div className="canvas-game snake-game">
      <canvas
        ref={canvasRef}
        aria-label="Snake growth playfield"
        onPointerDown={(event) => { touchRef.current = { x: event.clientX, y: event.clientY } }}
        onPointerUp={(event) => {
          const dx = event.clientX - touchRef.current.x
          const dy = event.clientY - touchRef.current.y
          if (Math.abs(dx) + Math.abs(dy) < 12) return
          turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'))
        }}
      />
      <div className="direction-pad" aria-label="Snake direction controls">
        <button onClick={() => turn('up')} aria-label="Move up"><ArrowUp /></button>
        <button onClick={() => turn('left')} aria-label="Move left"><ArrowLeft /></button>
        <button onClick={() => turn('down')} aria-label="Move down"><ArrowDown /></button>
        <button onClick={() => turn('right')} aria-label="Move right"><ArrowRight /></button>
      </div>
    </div>
  )
}
