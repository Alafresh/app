import { useCallback, useEffect, useRef, useState } from 'react'
import { clamp, type GameProps } from '../lib/experience'
import { useAnimationFrame } from '../hooks/useAnimationFrame'
import { useCanvasResolution } from '../hooks/useCanvasResolution'

export function OneChoice({ paused, onScore, onArtifact, playSound }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const size = useCanvasResolution(canvasRef)
  const aimRef = useRef({ x: size.width * 0.65, y: size.height * 0.4 })
  const shotRef = useRef<{ x: number; y: number; hit: number } | null>(null)
  const [used, setUsed] = useState(false)

  const fire = useCallback(() => {
    if (paused || shotRef.current) return
    const targetX = size.width * 0.5 + Math.sin(performance.now() / 1000 * 1.4) * size.width * 0.27
    const targetY = size.height * 0.38 + Math.cos(performance.now() / 1000 * 1.1) * size.height * 0.12
    const distance = Math.hypot(aimRef.current.x - targetX, aimRef.current.y - targetY)
    const hit = clamp(1 - distance / Math.min(size.width, size.height) * 2, 0, 1)
    const score = Math.round(hit * 100)
    shotRef.current = { ...aimRef.current, hit }
    setUsed(true)
    onScore(score)
    onArtifact({ score, label: hit > 0.8 ? 'DECISIVE ENCOUNTER' : 'A CHOICE, MADE', seed: 404 + score, values: [aimRef.current.x, aimRef.current.y, hit] })
    playSound('shot')
  }, [paused, size.width, size.height, onScore, onArtifact, playSound])

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.code === 'Space') { event.preventDefault(); fire() }
      if (event.code.startsWith('Arrow')) {
        event.preventDefault()
        if (event.code === 'ArrowLeft') aimRef.current.x -= 18
        if (event.code === 'ArrowRight') aimRef.current.x += 18
        if (event.code === 'ArrowUp') aimRef.current.y -= 18
        if (event.code === 'ArrowDown') aimRef.current.y += 18
      }
    }
    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [fire])

  useAnimationFrame((_delta, time) => {
    const context = canvasRef.current?.getContext('2d')
    if (!context) return
    context.clearRect(0, 0, size.width, size.height)
    context.fillStyle = 'rgba(8,8,8,.48)'; context.fillRect(0, 0, size.width, size.height)
    const targetX = size.width * 0.5 + Math.sin(time * 1.4) * size.width * 0.27
    const targetY = size.height * 0.38 + Math.cos(time * 1.1) * size.height * 0.12
    for (let ring = 4; ring > 0; ring -= 1) {
      context.strokeStyle = ring % 2 ? '#F33DBA' : 'rgba(255,255,255,.5)'
      context.lineWidth = ring === 1 ? 3 : 1
      context.beginPath(); context.arc(targetX, targetY, ring * 18, 0, Math.PI * 2); context.stroke()
    }
    const origin = { x: size.width / 2, y: size.height - 45 }
    const destination = shotRef.current || aimRef.current
    context.setLineDash([6, 8]); context.strokeStyle = 'rgba(217,255,63,.6)'
    context.beginPath(); context.moveTo(origin.x, origin.y); context.lineTo(destination.x, destination.y); context.stroke(); context.setLineDash([])
    context.fillStyle = '#D9FF3F'; context.beginPath(); context.arc(origin.x, origin.y, 9, 0, Math.PI * 2); context.fill()
    context.strokeStyle = '#fff'; context.lineWidth = 2
    context.beginPath(); context.moveTo(destination.x - 10, destination.y); context.lineTo(destination.x + 10, destination.y); context.moveTo(destination.x, destination.y - 10); context.lineTo(destination.x, destination.y + 10); context.stroke()
    if (shotRef.current) {
      const shot = shotRef.current
      context.strokeStyle = shot.hit > 0.65 ? '#D9FF3F' : '#F33DBA'
      context.lineWidth = 4
      context.beginPath(); context.arc(shot.x, shot.y, 22 + Math.sin(time * 3) * 3, 0, Math.PI * 2); context.stroke()
      context.fillStyle = '#fff'; context.font = '700 20px "Space Grotesk"'; context.textAlign = 'center'
      context.fillText(shot.hit > 0.8 ? 'A MEANINGFUL CHOICE™' : 'CHOICE ACCEPTED™', size.width / 2, 48)
    } else {
      context.fillStyle = '#aaa'; context.font = '12px "IBM Plex Mono"'; context.textAlign = 'center'
      context.fillText('ONE PROJECTILE REMAINING', size.width / 2, 28)
    }
    context.textAlign = 'left'
  }, paused)

  return (
    <div className="canvas-game">
      <canvas
        ref={canvasRef}
        aria-label="One choice aiming playfield"
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          if (!shotRef.current) aimRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top }
        }}
        onPointerDown={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          aimRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top }
          fire()
        }}
      />
      <button className="game-action" onClick={fire} disabled={used}>{used ? 'CHOICE MADE' : 'TAKE THE SHOT'} <kbd>SPACE</kbd></button>
    </div>
  )
}
