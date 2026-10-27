import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PALETTE, clamp, seeded, type GameProps } from '../lib/experience'
import { useAnimationFrame } from '../hooks/useAnimationFrame'
import { useCanvasResolution } from '../hooks/useCanvasResolution'
import { useLanguage } from '../lib/i18n'

type Block = { x: number; y: number; width: number; color: string }

export function TowerStack({ paused, phase, onScore, onArtifact, playSound }: GameProps) {
  const { t } = useLanguage()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const size = useCanvasResolution(canvasRef)
  const blocksRef = useRef<Block[]>([])
  const movingRef = useRef({ x: 0, width: 170, direction: 1, speed: 190 })
  const scoreRef = useRef(0)
  const flashRef = useRef(0)

  // Preserved tower state for post-game reveal
  const [placedBlocks, setPlacedBlocks] = useState<Block[]>([])
  const [revealedCount, setRevealedCount] = useState(1)

  useEffect(() => {
    const base = { x: size.width / 2 - 85, y: size.height - 42, width: 170, color: PALETTE[2] }
    blocksRef.current = [base]
    movingRef.current = { x: 30, width: 170, direction: 1, speed: 190 }
    scoreRef.current = 0
    onScore(0)
    onArtifact({ score: 0, label: 'VERTICAL AMBITION', seed: 101, values: [1, 170] })
  }, [size.width, size.height, onScore, onArtifact])

  // Sequentially reveal towers 1 -> 2 -> 3 during consequence
  useEffect(() => {
    if (phase === 'consequence') {
      let count = 1
      const timer = window.setInterval(() => {
        count += 1
        setRevealedCount(count)
        playSound('tap')
        if (count >= 3) {
          window.clearInterval(timer)
        }
      }, 550)
      return () => window.clearInterval(timer)
    }
  }, [phase, playSound])

  // Derive exactly 2 variations from the player's original tower
  const threeTowers = useMemo(() => {
    const base = { x: size.width / 2 - 85, y: size.height - 42, width: 170, color: PALETTE[2] }
    const original = placedBlocks.length > 0 ? placedBlocks : [base]
    const variations: Block[][] = [original] // index 0 is player's original

    for (let v = 1; v <= 2; v++) {
      const rng = seeded(2025 + v * 991 + original.length * 37)
      const variant: Block[] = original.map((block, idx) => {
        if (idx === 0) return { ...block } // same foundation
        const widthMultiplier = 0.88 + rng() * 0.24 // subtle width change (+-12%)
        const newWidth = Math.max(28, Math.min(180, block.width * widthMultiplier))
        const shiftX = (rng() - 0.5) * 16 // slight placement jitter
        const colorOffset = rng() > 0.65 ? 1 : 0
        const colorIdx = (PALETTE.indexOf(block.color as typeof PALETTE[number]) + colorOffset) % 3

        return {
          x: block.x + shiftX,
          y: block.y,
          width: newWidth,
          color: colorIdx >= 0 ? PALETTE[colorIdx] : block.color,
        }
      })
      variations.push(variant)
    }
    return variations
  }, [placedBlocks, size.width, size.height])

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
    setPlacedBlocks([...blocks])
    scoreRef.current += 10 + Math.round(accuracy * 10)
    onScore(scoreRef.current)
    onArtifact({
      score: scoreRef.current,
      label: `TOWER / ${blocks.length - 1} LEVELS`,
      seed: 101 + blocks.length,
      values: [blocks.length, overlap, accuracy],
    })

    moving.width = overlap
    moving.x = moving.direction > 0 ? 12 : size.width - overlap - 12
    moving.speed = Math.min(360, moving.speed + 9)
    flashRef.current = 1
    playSound(accuracy > 0.88 ? 'score' : 'tap')
  }, [paused, phase, size.width, onScore, onArtifact, playSound])

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (phase !== 'playing') return
      if (event.code === 'Space') {
        event.preventDefault()
        drop()
      }
    }
    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [drop, phase])

  // Canvas loop exclusively for active gameplay
  useAnimationFrame((delta, time) => {
    if (phase !== 'playing') return
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    const moving = movingRef.current
    moving.x += moving.direction * moving.speed * delta
    if (moving.x < 10) {
      moving.x = 10
      moving.direction = 1
    }
    if (moving.x + moving.width > size.width - 10) {
      moving.x = size.width - moving.width - 10
      moving.direction = -1
    }
    flashRef.current = Math.max(0, flashRef.current - delta * 4)

    context.clearRect(0, 0, size.width, size.height)
    context.fillStyle = 'rgba(8,8,8,.38)'
    context.fillRect(0, 0, size.width, size.height)

    // Background grid lines
    context.strokeStyle = 'rgba(217,255,63,.12)'
    context.lineWidth = 1
    for (let x = 0; x < size.width; x += 40) {
      context.beginPath()
      context.moveTo(x, 0)
      context.lineTo(x, size.height)
      context.stroke()
    }

    const blocks = blocksRef.current
    const camera = Math.max(0, (blocks.length - 8) * 31)

    // Render stacked blocks
    blocks.forEach((block, index) => {
      const y = block.y + camera
      if (y < -40 || y > size.height + 40) return
      context.fillStyle = block.color
      context.fillRect(block.x, y, block.width, 27)
      context.fillStyle = 'rgba(8,8,8,.24)'
      context.fillRect(block.x, y + 20, block.width, 7)
      if (index === blocks.length - 1) {
        context.strokeStyle = '#fff'
        context.strokeRect(block.x - 3, y - 3, block.width + 6, 33)
      }
    })

    // Moving block
    const previous = blocks[blocks.length - 1]
    const movingY = clamp(previous.y - 100 + camera + Math.sin(time * 2) * 4, 50, size.height - 80)
    context.fillStyle = PALETTE[blocks.length % 3]
    context.fillRect(moving.x, movingY, moving.width, 27)

    // Flash
    context.fillStyle = `rgba(217,255,63,${flashRef.current * 0.18})`
    context.fillRect(0, 0, size.width, size.height)

    // HUD in canvas
    context.fillStyle = '#aaa'
    context.font = '12px "IBM Plex Mono"'
    context.fillText(`${blocks.length - 1} ${t.gameplay.tower.blocksCertified}`, 16, 24)
  }, paused)

  const isPostGame = phase === 'consequence' || phase === 'reflection'

  return (
    <div className="canvas-game" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {!isPostGame ? (
        <>
          <canvas ref={canvasRef} onPointerDown={drop} aria-label="Tower stacking playfield" />
          <button className="game-action" onClick={drop}>
            {t.gameplay.tower.dropBlock} <kbd>SPACE</kbd>
          </button>
        </>
      ) : (
        /* Reliable SVG Presentation (matching Color Factory reveal structure) */
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className="factory-tools" style={{ justifyContent: 'space-between' }}>
            <span className="system-label" style={{ color: '#D9FF3F' }}>
              {t.gameplay.tower.revealBanner}
            </span>
            <span className="factory-count">
              EDITION 0{revealedCount} / 03
            </span>
          </div>

          <svg
            className="factory-canvas"
            viewBox="0 0 800 450"
            preserveAspectRatio="xMidYMid meet"
            aria-label="Tower Stack Masterpiece Variations"
          >
            <rect width="800" height="450" fill="#090909" />

            {/* Background perspective grid lines */}
            <path d="M0 380 H800 M266 0 V450 M533 0 V450" stroke="#fff" strokeOpacity=".06" />

            {threeTowers.slice(0, revealedCount).map((tower, tIdx) => {
              const isOriginal = tIdx === 0
              const colW = 236
              const colH = 390
              const colX = 22 + tIdx * (colW + 24)
              const colY = 24

              // Calculate scale so any height tower fits gracefully inside the frame
              const blockCount = Math.max(1, tower.length)
              const maxBlockStackHeight = blockCount * 28
              const scale = Math.min(1, 250 / Math.max(140, maxBlockStackHeight))

              const cardCenterX = colX + colW / 2
              const groundBaseY = colY + colH - 62

              const baseBlock = tower[0] || { x: size.width / 2 - 85, width: 170 }
              const towerBaseCenter = baseBlock.x + baseBlock.width / 2

              const labelText = isOriginal
                ? t.gameplay.tower.original
                : tIdx === 1
                ? t.gameplay.tower.masterpiece2
                : t.gameplay.tower.masterpiece3

              return (
                <g key={tIdx}>
                  {/* Card Pedestal Frame */}
                  <rect
                    x={colX}
                    y={colY}
                    width={colW}
                    height={colH}
                    fill="#111111"
                    stroke={isOriginal ? '#D9FF3F' : 'rgba(255,255,255,0.18)'}
                    strokeWidth={isOriginal ? 2 : 1}
                  />

                  {/* Top indicator tag */}
                  {isOriginal && (
                    <g transform={`translate(${colX + 12}, ${colY + 20})`}>
                      <rect x="0" y="-12" width="76" height="18" fill="#D9FF3F" />
                      <text x="38" y="1" textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="9" fontWeight="bold" fill="#080808">
                        ★ CREATION
                      </text>
                    </g>
                  )}

                  {/* Ground base platform line */}
                  <line
                    x1={colX + 16}
                    y1={groundBaseY + 2}
                    x2={colX + colW - 16}
                    y2={groundBaseY + 2}
                    stroke={isOriginal ? '#D9FF3F' : 'rgba(255,255,255,0.3)'}
                    strokeWidth="2"
                  />

                  {/* Render Tower Blocks with geometric precision */}
                  <g>
                    {tower.map((block, bIdx) => {
                      const relX = block.x - towerBaseCenter
                      const relY = bIdx * 28 // uniform stacking interval

                      const drawW = Math.max(20, block.width * scale)
                      const drawH = 24 * scale
                      const drawX = cardCenterX + relX * scale - drawW / 2
                      const drawY = groundBaseY - (relY + 28) * scale

                      return (
                        <g key={bIdx}>
                          {/* Block Body */}
                          <rect
                            x={drawX}
                            y={drawY}
                            width={drawW}
                            height={drawH}
                            fill={block.color}
                          />
                          {/* 3D bottom bevel */}
                          <rect
                            x={drawX}
                            y={drawY + drawH * 0.72}
                            width={drawW}
                            height={drawH * 0.28}
                            fill="rgba(8,8,8,0.28)"
                          />
                          {/* Top block highlight */}
                          {bIdx === tower.length - 1 && (
                            <rect
                              x={drawX - 2}
                              y={drawY - 2}
                              width={drawW + 4}
                              height={drawH + 4}
                              fill="none"
                              stroke="#FFFFFF"
                              strokeWidth="1.5"
                            />
                          )}
                        </g>
                      )
                    })}
                  </g>

                  {/* Prominent Label Badge */}
                  <rect
                    x={colX + 10}
                    y={colY + colH - 42}
                    width={colW - 20}
                    height="30"
                    fill={isOriginal ? '#D9FF3F' : 'rgba(28,28,28,0.92)'}
                    stroke={isOriginal ? 'none' : 'rgba(255,255,255,0.15)'}
                    strokeWidth="1"
                  />
                  <text
                    x={cardCenterX}
                    y={colY + colH - 22}
                    textAnchor="middle"
                    fontFamily="IBM Plex Mono"
                    fontSize={isOriginal ? '13' : '11'}
                    fontWeight="bold"
                    fill={isOriginal ? '#080808' : '#FFFFFF'}
                    letterSpacing="0.04em"
                  >
                    {labelText}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      )}
    </div>
  )
}
