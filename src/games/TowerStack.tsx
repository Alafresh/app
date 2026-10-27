import { useCallback, useEffect, useRef } from 'react'
import { PALETTE, clamp, type GameProps } from '../lib/experience'
import { useAnimationFrame } from '../hooks/useAnimationFrame'
import { useCanvasResolution } from '../hooks/useCanvasResolution'

type Block = { x: number; y: number; width: number; color: string }

export function TowerStack({ paused, onScore, onArtifact, playSound }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const size = useCanvasResolution(canvasRef)
  const blocksRef = useRef<Block[]>([])
  const movingRef = useRef({ x: 0, width: 170, direction: 1, speed: 190 })
  const scoreRef = useRef(0)
  const flashRef = useRef(0)

  useEffect(() => {
    const base = { x: size.width / 2 - 85, y: size.height - 42, width: 170, color: PALETTE[2] }
    blocksRef.current = [base]
    movingRef.current = { x: 30, width: 170, direction: 1, speed: 190 }
    scoreRef.current = 0
    onScore(0)
    onArtifact({ score: 0, label: 'VERTICAL AMBITION', seed: 101, values: [1, 170] })
  }, [size.width, size.height, onScore, onArtifact])

  const drop = useCallback(() => {
    if (paused || blocksRef.current.length === 0) return
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
  }, [paused, size.width, onScore, onArtifact, playSound])

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
    const moving = movingRef.current
    moving.x += moving.direction * moving.speed * delta
    if (moving.x < 10) { moving.x = 10; moving.direction = 1 }
    if (moving.x + moving.width > size.width - 10) { moving.x = size.width - moving.width - 10; moving.direction = -1 }
    flashRef.current = Math.max(0, flashRef.current - delta * 4)
    context.clearRect(0, 0, size.width, size.height)
    context.fillStyle = 'rgba(8,8,8,.38)'
    context.fillRect(0, 0, size.width, size.height)
    context.strokeStyle = 'rgba(217,255,63,.12)'
    context.lineWidth = 1
    for (let x = 0; x < size.width; x += 40) {
      context.beginPath(); context.moveTo(x, 0); context.lineTo(x, size.height); context.stroke()
    }
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
  }, paused)

  return (
    <div className="canvas-game">
      <canvas ref={canvasRef} onPointerDown={drop} aria-label="Tower stacking playfield" />
      <button className="game-action" onClick={drop}>DROP BLOCK <kbd>SPACE</kbd></button>
    </div>
  )
}
