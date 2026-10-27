import { useEffect, useMemo, useState } from 'react'
import { Circle, Square, Triangle } from 'lucide-react'
import { PALETTE, seeded, type GameProps } from '../lib/experience'
import { useLanguage } from '../lib/i18n'

type Shape = { x: number; y: number; color: string; kind: number; rotation: number; scale: number }
const colors = [...PALETTE]

export function ColorFactory({ phase, onScore, onArtifact, playSound }: GameProps) {
  const { t } = useLanguage()
  const [selectedColor, setSelectedColor] = useState(colors[0])
  const [selectedShape, setSelectedShape] = useState(0)
  const [shapes, setShapes] = useState<Shape[]>([])
  const [revealedCount, setRevealedCount] = useState(1)

  const addShape = (x: number, y: number) => {
    if (phase !== 'playing') return
    const random = seeded(505 + shapes.length * 31)
    const shape = {
      x,
      y,
      color: selectedColor,
      kind: selectedShape,
      rotation: random() * 50 - 25,
      scale: 0.65 + random() * 0.85,
    }
    const next = [...shapes, shape].slice(-36)
    setShapes(next)
    const score = next.length * 15
    onScore(score)
    onArtifact({
      score,
      label: `COMPOSITION / ${next.length} MARKS`,
      seed: 505 + next.length,
      values: [next.length, selectedShape, x, y],
      colors: [selectedColor],
    })
    playSound('tap')
  }

  // Pure memoized derived gallery from original signature
  const variations = useMemo(() => {
    if (phase !== 'consequence' && phase !== 'reflection') return []
    const baseShapes = shapes.length > 0 ? shapes : [
      { x: 300, y: 200, color: colors[0], kind: 0, rotation: 10, scale: 1 },
      { x: 450, y: 220, color: colors[1], kind: 1, rotation: -15, scale: 0.9 },
      { x: 380, y: 280, color: colors[2], kind: 2, rotation: 25, scale: 1.1 },
    ]

    const derived: Shape[][] = [baseShapes] // slot 0 is original
    for (let i = 1; i <= 7; i++) {
      const rng = seeded(9901 + i * 317 + baseShapes.length * 13)
      const variant = baseShapes.map((s) => ({
        x: Math.max(80, Math.min(720, s.x + (rng() - 0.5) * 80)),
        y: Math.max(60, Math.min(390, s.y + (rng() - 0.5) * 70)),
        color: s.color,
        kind: s.kind,
        rotation: s.rotation + (rng() - 0.5) * 35,
        scale: s.scale * (0.85 + rng() * 0.3),
      }))
      derived.push(variant)
    }
    return derived
  }, [phase, shapes])

  // Progressively expand the gallery in consequence phase
  useEffect(() => {
    if (phase === 'consequence') {
      let count = 1
      const interval = window.setInterval(() => {
        count += 1
        setRevealedCount(count)
        playSound('tap')
        if (count >= 8) {
          window.clearInterval(interval)
        }
      }, 350)
      return () => window.clearInterval(interval)
    }
  }, [phase, playSound])

  const isPostGame = phase === 'consequence' || phase === 'reflection'

  return (
    <div className="factory-game">
      {phase === 'playing' ? (
        <div className="factory-tools" aria-label="Composition tools">
          <div className="tool-group">
            <span>{t.gameplay.factory.color}</span>
            {colors.map((color) => (
              <button
                key={color}
                className={`color-swatch ${selectedColor === color ? 'selected' : ''}`}
                style={{ '--swatch': color } as React.CSSProperties}
                onClick={() => {
                  setSelectedColor(color)
                  playSound('tap')
                }}
                aria-label={`Select ${color}`}
                aria-pressed={selectedColor === color}
              />
            ))}
          </div>
          <div className="tool-group">
            <span>{t.gameplay.factory.form}</span>
            {[Circle, Square, Triangle].map((Icon, index) => (
              <button
                key={index}
                className={`shape-tool ${selectedShape === index ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedShape(index)
                  playSound('tap')
                }}
                aria-label={`Select ${['circle', 'square', 'triangle'][index]}`}
                aria-pressed={selectedShape === index}
              >
                <Icon size={19} />
              </button>
            ))}
          </div>
          <span className="factory-count">{String(shapes.length).padStart(2, '0')} / ∞</span>
        </div>
      ) : (
        <div className="factory-tools" style={{ justifyContent: 'space-between' }}>
          <span className="system-label" style={{ color: '#D9FF3F' }}>
            {t.gameplay.factory.automatedBanner}
          </span>
          <span className="factory-count">
            {t.gameplay.factory.edition} 0{revealedCount} / 08
          </span>
        </div>
      )}

      {!isPostGame ? (
        <svg
          className="factory-canvas"
          viewBox="0 0 800 450"
          preserveAspectRatio="xMidYMid meet"
          aria-label="Your generated color composition"
          onPointerDown={(event) => {
            const rect = event.currentTarget.getBoundingClientRect()
            addShape(
              ((event.clientX - rect.left) / rect.width) * 800,
              ((event.clientY - rect.top) / rect.height) * 450
            )
          }}
        >
          <rect width="800" height="450" fill="#0d0d0d" />
          <path d="M0 375H800M625 0V450" stroke="#fff" strokeOpacity=".08" />
          {shapes.map((shape, index) => (
            <g
              key={index}
              transform={`translate(${shape.x} ${shape.y}) rotate(${shape.rotation}) scale(${shape.scale})`}
              className="factory-shape"
            >
              {shape.kind === 0 && <circle r="42" fill={shape.color} />}
              {shape.kind === 1 && <rect x="-40" y="-40" width="80" height="80" fill={shape.color} />}
              {shape.kind === 2 && <path d="M0-48 48 40H-48Z" fill={shape.color} />}
              <circle r="5" cx="20" cy="-18" fill="#080808" opacity=".35" />
            </g>
          ))}
          {shapes.length === 0 && (
            <text x="400" y="230" textAnchor="middle" fill="#777" fontFamily="IBM Plex Mono" fontSize="14">
              {t.gameplay.factory.emptyPrompt}
            </text>
          )}
        </svg>
      ) : (
        /* Gallery of 8 compositions (4x2 grid) derived from player's original piece */
        <svg
          className="factory-canvas"
          viewBox="0 0 800 450"
          preserveAspectRatio="xMidYMid meet"
          aria-label="Repeated formula gallery"
        >
          <rect width="800" height="450" fill="#090909" />
          {variations.slice(0, revealedCount).map((variant, cardIdx) => {
            const col = cardIdx % 4
            const row = Math.floor(cardIdx / 4)
            const cellW = 186
            const cellH = 196
            const cellX = 14 + col * (cellW + 10)
            const cellY = 16 + row * (cellH + 24)
            const isOriginal = cardIdx === 0

            return (
              <g key={cardIdx} transform={`translate(${cellX}, ${cellY})`}>
                {/* Background frame */}
                <rect
                  width={cellW}
                  height={cellH}
                  fill="#111111"
                  stroke={isOriginal ? '#D9FF3F' : 'rgba(255,255,255,0.18)'}
                  strokeWidth={isOriginal ? 2 : 1}
                />
                {/* Mini canvas scaled down */}
                <g transform={`scale(${cellW / 800})`}>
                  {variant.map((s, sIdx) => (
                    <g
                      key={sIdx}
                      transform={`translate(${s.x} ${s.y}) rotate(${s.rotation}) scale(${s.scale})`}
                    >
                      {s.kind === 0 && <circle r="42" fill={s.color} />}
                      {s.kind === 1 && <rect x="-40" y="-40" width="80" height="80" fill={s.color} />}
                      {s.kind === 2 && <path d="M0-48 48 40H-48Z" fill={s.color} />}
                      <circle r="5" cx="20" cy="-18" fill="#080808" opacity=".35" />
                    </g>
                  ))}
                </g>
                {/* Frame Label */}
                <rect
                  x="0"
                  y={cellH - 22}
                  width={cellW}
                  height="22"
                  fill={isOriginal ? '#D9FF3F' : 'rgba(20,20,20,0.95)'}
                />
                <text
                  x={cellW / 2}
                  y={cellH - 7}
                  textAnchor="middle"
                  fontFamily="IBM Plex Mono"
                  fontSize="10"
                  fontWeight="bold"
                  fill={isOriginal ? '#080808' : '#aaaaaa'}
                >
                  {isOriginal ? t.gameplay.factory.originalStyle : `${t.gameplay.factory.formula} #00${cardIdx + 1}`}
                </text>
              </g>
            )
          })}
        </svg>
      )}
    </div>
  )
}
