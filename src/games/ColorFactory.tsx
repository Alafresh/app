import { useState } from 'react'
import { Circle, Square, Triangle } from 'lucide-react'
import { PALETTE, seeded, type GameProps } from '../lib/experience'

type Shape = { x: number; y: number; color: string; kind: number; rotation: number; scale: number }
const colors = [...PALETTE]

export function ColorFactory({ onScore, onArtifact, playSound }: GameProps) {
  const [selectedColor, setSelectedColor] = useState(colors[0])
  const [selectedShape, setSelectedShape] = useState(0)
  const [shapes, setShapes] = useState<Shape[]>([])

  const addShape = (x: number, y: number) => {
    if (shapes.length >= 36) setShapes((current) => current.slice(1))
    const random = seeded(505 + shapes.length * 31)
    const shape = { x, y, color: selectedColor, kind: selectedShape, rotation: random() * 50 - 25, scale: 0.65 + random() * 0.85 }
    const next = [...shapes, shape].slice(-36)
    setShapes(next)
    const score = next.length * 15
    onScore(score)
    onArtifact({ score, label: `COMPOSITION / ${next.length} MARKS`, seed: 505 + next.length, values: [next.length, selectedShape, x, y], colors: [selectedColor] })
    playSound('tap')
  }

  return (
    <div className="factory-game">
      <div className="factory-tools" aria-label="Composition tools">
        <div className="tool-group">
          <span>COLOR</span>
          {colors.map((color) => (
            <button key={color} className={`color-swatch ${selectedColor === color ? 'selected' : ''}`} style={{ '--swatch': color } as React.CSSProperties} onClick={() => { setSelectedColor(color); playSound('tap') }} aria-label={`Select ${color}`} aria-pressed={selectedColor === color} />
          ))}
        </div>
        <div className="tool-group">
          <span>FORM</span>
          {[Circle, Square, Triangle].map((Icon, index) => (
            <button key={index} className={`shape-tool ${selectedShape === index ? 'selected' : ''}`} onClick={() => { setSelectedShape(index); playSound('tap') }} aria-label={`Select ${['circle', 'square', 'triangle'][index]}`} aria-pressed={selectedShape === index}><Icon size={19} /></button>
          ))}
        </div>
        <span className="factory-count">{String(shapes.length).padStart(2, '0')} / ∞</span>
      </div>
      <svg
        className="factory-canvas"
        viewBox="0 0 800 450"
        preserveAspectRatio="xMidYMid meet"
        aria-label="Your generated color composition"
        onPointerDown={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          addShape((event.clientX - rect.left) / rect.width * 800, (event.clientY - rect.top) / rect.height * 450)
        }}
      >
        <rect width="800" height="450" fill="#0d0d0d" />
        <path d="M0 375H800M625 0V450" stroke="#fff" strokeOpacity=".08" />
        {shapes.map((shape, index) => (
          <g key={index} transform={`translate(${shape.x} ${shape.y}) rotate(${shape.rotation}) scale(${shape.scale})`} className="factory-shape">
            {shape.kind === 0 && <circle r="42" fill={shape.color} />}
            {shape.kind === 1 && <rect x="-40" y="-40" width="80" height="80" fill={shape.color} />}
            {shape.kind === 2 && <path d="M0-48 48 40H-48Z" fill={shape.color} />}
            <circle r="5" cx="20" cy="-18" fill="#080808" opacity=".35" />
          </g>
        ))}
        {shapes.length === 0 && <text x="400" y="230" textAnchor="middle" fill="#777" fontFamily="IBM Plex Mono" fontSize="14">CLICK ANYWHERE TO MANUFACTURE MEANING</text>}
      </svg>
    </div>
  )
}
