import { useEffect, useRef } from 'react'
import { PALETTE, type GameProps } from '../lib/experience'
import { useAnimationFrame } from '../hooks/useAnimationFrame'
import { useCanvasResolution } from '../hooks/useCanvasResolution'

type Brick = { x: number; y: number; width: number; height: number; alive: boolean; color: string }

export function BreakEverything({ paused, onScore, onArtifact, playSound }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const size = useCanvasResolution(canvasRef)
  const paddleRef = useRef({ x: 300, width: 100 })
  const ballRef = useRef({ x: 400, y: 300, vx: 190, vy: -240 })
  const bricksRef = useRef<Brick[]>([])
  const scoreRef = useRef(0)
  const brokenRef = useRef(0)
  const keysRef = useRef({ left: false, right: false })
  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current || size.width < 10) return
    initializedRef.current = true
    const columns = size.width < 500 ? 5 : 8
    const gap = 7
    const width = (size.width - 40 - gap * (columns - 1)) / columns
    bricksRef.current = Array.from({ length: columns * 4 }, (_, index) => ({
      x: 20 + (index % columns) * (width + gap), y: 45 + Math.floor(index / columns) * 34,
      width, height: 24, alive: true, color: PALETTE[Math.floor(index / columns) % 3],
    }))
    paddleRef.current.x = size.width / 2 - 50
    ballRef.current = { x: size.width / 2, y: size.height - 110, vx: 190, vy: -240 }
  }, [size.width, size.height])

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.code === 'ArrowLeft' || event.code === 'KeyA') { keysRef.current.left = true; event.preventDefault() }
      if (event.code === 'ArrowRight' || event.code === 'KeyD') { keysRef.current.right = true; event.preventDefault() }
    }
    const keyup = (event: KeyboardEvent) => {
      if (event.code === 'ArrowLeft' || event.code === 'KeyA') keysRef.current.left = false
      if (event.code === 'ArrowRight' || event.code === 'KeyD') keysRef.current.right = false
    }
    window.addEventListener('keydown', keydown); window.addEventListener('keyup', keyup)
    return () => { window.removeEventListener('keydown', keydown); window.removeEventListener('keyup', keyup) }
  }, [])

  useAnimationFrame((delta) => {
    const context = canvasRef.current?.getContext('2d')
    if (!context) return
    const paddle = paddleRef.current
    const ball = ballRef.current
    if (keysRef.current.left) paddle.x -= 390 * delta
    if (keysRef.current.right) paddle.x += 390 * delta
    paddle.x = Math.max(6, Math.min(size.width - paddle.width - 6, paddle.x))
    ball.x += ball.vx * delta; ball.y += ball.vy * delta
    if (ball.x < 10 || ball.x > size.width - 10) { ball.vx *= -1; ball.x = Math.max(10, Math.min(size.width - 10, ball.x)) }
    if (ball.y < 10) { ball.vy = Math.abs(ball.vy) }
    if (ball.y > size.height + 20) { ball.x = size.width / 2; ball.y = size.height - 100; ball.vx = 190; ball.vy = -240 }
    const paddleY = size.height - 36
    if (ball.vy > 0 && ball.y + 9 > paddleY && ball.y < paddleY + 14 && ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
      ball.vy = -Math.abs(ball.vy)
      ball.vx += ((ball.x - (paddle.x + paddle.width / 2)) / paddle.width) * 90
      playSound('tap')
    }
    bricksRef.current.forEach((brick) => {
      if (!brick.alive) return
      if (ball.x + 8 > brick.x && ball.x - 8 < brick.x + brick.width && ball.y + 8 > brick.y && ball.y - 8 < brick.y + brick.height) {
        brick.alive = false; ball.vy *= -1
        scoreRef.current += 10; brokenRef.current += 1
        onScore(scoreRef.current); playSound('break')
        if (brokenRef.current % 3 === 0) {
          const hidden = bricksRef.current.find((item) => !item.alive && item !== brick)
          if (hidden) hidden.alive = true
        }
        onArtifact({ score: scoreRef.current, label: `DESTRUCTION / ${brokenRef.current} BLOCKS`, seed: 606 + brokenRef.current, values: [brokenRef.current, bricksRef.current.filter((item) => item.alive).length, ball.x] })
      }
    })
    context.clearRect(0, 0, size.width, size.height)
    context.fillStyle = 'rgba(8,8,8,.52)'; context.fillRect(0, 0, size.width, size.height)
    bricksRef.current.forEach((brick) => {
      if (!brick.alive) return
      context.fillStyle = brick.color; context.fillRect(brick.x, brick.y, brick.width, brick.height)
      context.fillStyle = 'rgba(8,8,8,.25)'; context.fillRect(brick.x, brick.y + brick.height - 5, brick.width, 5)
    })
    context.fillStyle = '#fff'; context.fillRect(paddle.x, paddleY, paddle.width, 10)
    context.fillStyle = '#D9FF3F'; context.beginPath(); context.arc(ball.x, ball.y, 8, 0, Math.PI * 2); context.fill()
    context.fillStyle = '#aaa'; context.font = '12px "IBM Plex Mono"'
    context.fillText(`BLOCKS REPLICATING / ${bricksRef.current.filter((brick) => brick.alive).length} REMAIN`, 14, 24)
  }, paused)

  return (
    <div className="canvas-game">
      <canvas
        ref={canvasRef}
        aria-label="Brick breaking playfield"
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          paddleRef.current.x = Math.max(6, Math.min(size.width - paddleRef.current.width - 6, event.clientX - rect.left - paddleRef.current.width / 2))
        }}
        onPointerDown={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          paddleRef.current.x = event.clientX - rect.left - paddleRef.current.width / 2
        }}
      />
      <div className="paddle-hint">← MOVE &nbsp; / &nbsp; MOVE →</div>
    </div>
  )
}
