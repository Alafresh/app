import { useCallback, useEffect, useRef } from 'react'
import { PALETTE, seeded, type GameProps } from '../lib/experience'
import { useAnimationFrame } from '../hooks/useAnimationFrame'
import { useCanvasResolution } from '../hooks/useCanvasResolution'

type Obstacle = { x: number; height: number; width: number; hue: number }

export function ChunkRunner({ paused, onScore, onArtifact, playSound }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const size = useCanvasResolution(canvasRef)
  const playerRef = useRef({ y: 0, velocity: 0, jumps: 0 })
  const obstaclesRef = useRef<Obstacle[]>([])
  const distanceRef = useRef(0)
  const spawnRef = useRef(0.8)
  const randomRef = useRef(seeded(202))

  const jump = useCallback(() => {
    if (paused) return
    const player = playerRef.current
    if (player.y <= 0.5) {
      player.velocity = 510
      player.jumps += 1
      playSound('jump')
    }
  }, [paused, playSound])

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'ArrowUp') { event.preventDefault(); jump() }
    }
    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [jump])

  useAnimationFrame((delta, time) => {
    const context = canvasRef.current?.getContext('2d')
    if (!context) return
    const ground = size.height - 68
    const player = playerRef.current
    const speed = 220 + Math.min(120, distanceRef.current * 0.06)
    distanceRef.current += delta * speed * 0.1
    onScore(Math.floor(distanceRef.current))
    player.velocity -= 1250 * delta
    player.y = Math.max(0, player.y + player.velocity * delta)
    if (player.y === 0) player.velocity = 0
    spawnRef.current -= delta
    if (spawnRef.current <= 0) {
      const random = randomRef.current
      obstaclesRef.current.push({ x: size.width + 30, height: 28 + random() * 44, width: 22 + random() * 25, hue: Math.floor(random() * 3) })
      spawnRef.current = 0.85 + randomRef.current() * 0.8
    }
    obstaclesRef.current.forEach((obstacle) => { obstacle.x -= speed * delta })
    obstaclesRef.current = obstaclesRef.current.filter((obstacle) => obstacle.x > -80)
    const playerX = Math.max(55, size.width * 0.18)
    obstaclesRef.current.forEach((obstacle) => {
      const collides = playerX + 28 > obstacle.x && playerX < obstacle.x + obstacle.width && player.y < obstacle.height - 5
      if (collides) {
        obstacle.x = -100
        player.velocity = 260
        playSound('tap')
      }
    })
    onArtifact({ score: Math.floor(distanceRef.current), label: `RUNNER / ${player.jumps} LEAPS`, seed: 202 + player.jumps, values: [Math.floor(distanceRef.current), player.jumps, obstaclesRef.current.length] })
    context.clearRect(0, 0, size.width, size.height)
    context.fillStyle = 'rgba(8,8,8,.45)'; context.fillRect(0, 0, size.width, size.height)
    context.strokeStyle = 'rgba(255,255,255,.13)'
    for (let i = 0; i < 12; i += 1) {
      const x = ((i * 130 - distanceRef.current * 7) % (size.width + 130)) - 40
      context.beginPath(); context.moveTo(x, ground); context.lineTo(x + 80, ground - 90); context.stroke()
    }
    context.strokeStyle = '#D9FF3F'; context.lineWidth = 2
    context.beginPath(); context.moveTo(0, ground + 1); context.lineTo(size.width, ground + 1); context.stroke()
    obstaclesRef.current.forEach((obstacle) => {
      context.fillStyle = PALETTE[obstacle.hue]
      context.fillRect(obstacle.x, ground - obstacle.height, obstacle.width, obstacle.height)
      context.fillStyle = '#080808'
      context.fillRect(obstacle.x + 5, ground - obstacle.height + 7, Math.max(3, obstacle.width - 10), 4)
    })
    const bob = player.y === 0 ? Math.sin(time * 15) * 2 : 0
    context.save()
    context.translate(playerX, ground - 34 - player.y + bob)
    context.rotate(distanceRef.current * 0.04)
    context.fillStyle = '#D9FF3F'; context.fillRect(-15, -15, 30, 30)
    context.fillStyle = '#080808'; context.fillRect(3, -7, 6, 6)
    context.restore()
    context.fillStyle = 'rgba(217,255,63,.18)'
    context.fillRect(playerX - 15, ground + 5, 30, 3)
    context.fillStyle = '#aaa'; context.font = '12px "IBM Plex Mono"'
    context.fillText(`PROCEDURAL TRACK ${String(Math.floor(distanceRef.current)).padStart(4, '0')}`, 16, 24)
  }, paused)

  return (
    <div className="canvas-game">
      <canvas ref={canvasRef} onPointerDown={jump} aria-label="Geometric runner playfield" />
      <button className="game-action" onClick={jump}>JUMP <kbd>SPACE</kbd></button>
    </div>
  )
}
