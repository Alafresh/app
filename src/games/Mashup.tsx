import { useState } from 'react'
import { Combine, Cpu, Cloud, Flower2, Music2, Building2, Network } from 'lucide-react'
import { PALETTE, type GameProps } from '../lib/experience'

const ideas = [
  { name: 'ROOT SYSTEM', icon: Network },
  { name: 'CIRCUIT', icon: Cpu },
  { name: 'CLOUD', icon: Cloud },
  { name: 'ORGANISM', icon: Flower2 },
  { name: 'INSTRUMENT', icon: Music2 },
  { name: 'BUILDING', icon: Building2 },
]

export function Mashup({ onScore, onArtifact, playSound }: GameProps) {
  const [selected, setSelected] = useState<number[]>([])
  const [connections, setConnections] = useState(0)
  const [result, setResult] = useState<{ a: number; b: number; edition: number } | null>(null)

  const toggle = (index: number) => {
    setSelected((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index].slice(-2))
    playSound('tap')
  }

  const combine = () => {
    if (selected.length !== 2) return
    const nextConnections = connections + 1
    const edition = selected[0] * 7 + selected[1] * 13 + nextConnections
    setConnections(nextConnections)
    setResult({ a: selected[0], b: selected[1], edition })
    const score = nextConnections * 40
    onScore(score)
    onArtifact({ score, label: `${ideas[selected[0]].name} × ${ideas[selected[1]].name}`, seed: 808 + edition, values: [selected[0], selected[1], nextConnections], colors: [PALETTE[selected[0] % 3], PALETTE[selected[1] % 3]] })
    playSound('combine')
    setSelected([])
  }

  return (
    <div className="mashup-game">
      <div className="idea-bank" aria-label="Ideas to combine">
        {ideas.map((idea, index) => {
          const Icon = idea.icon
          return <button key={idea.name} className={selected.includes(index) ? 'selected' : ''} onClick={() => toggle(index)} aria-pressed={selected.includes(index)}><Icon size={22} /><span>{idea.name}</span><small>{selected.includes(index) ? `SLOT ${selected.indexOf(index) + 1}` : 'SELECT'}</small></button>
        })}
      </div>
      <div className="mashup-lab">
        <div className="mashup-slots">
          <span>{selected[0] !== undefined ? ideas[selected[0]].name : 'FIRST IDEA'}</span>
          <b>×</b>
          <span>{selected[1] !== undefined ? ideas[selected[1]].name : 'SECOND IDEA'}</span>
        </div>
        <button className="combine-button" onClick={combine} disabled={selected.length !== 2}><Combine size={19} /> MAKE A CONNECTION</button>
        <div className={`mashup-result ${result ? 'has-result' : ''}`}>
          {result ? (
            <>
              <svg viewBox="0 0 240 150" role="img" aria-label={`Hybrid of ${ideas[result.a].name} and ${ideas[result.b].name}`}>
                <g transform="translate(120 75)">
                  {Array.from({ length: 9 }, (_, index) => {
                    const angle = index / 9 * Math.PI * 2
                    const radius = 35 + (index % 3) * 9
                    return <path key={index} d={`M0 18 Q ${Math.cos(angle) * radius * 0.45} ${Math.sin(angle) * radius * 0.45} ${Math.cos(angle) * radius} ${Math.sin(angle) * radius}`} fill="none" stroke={PALETTE[result.a % 3]} strokeWidth="3" />
                  })}
                  <rect x="-32" y="-32" width="64" height="64" rx={result.b % 2 ? 30 : 3} fill="#080808" stroke={PALETTE[result.b % 3]} strokeWidth="4" transform={`rotate(${result.edition * 7})`} />
                  <circle r="13" fill={PALETTE[(result.a + result.b) % 3]} />
                  <path d="M-12 0H12M0-12V12" stroke="#080808" strokeWidth="3" />
                </g>
              </svg>
              <strong>{ideas[result.a].name} × {ideas[result.b].name}</strong>
              <span>CONNECTION {String(connections).padStart(2, '0')} / UNREPEATABLE*</span>
            </>
          ) : <span>YOUR UNEXPECTED OBJECT WILL APPEAR HERE</span>}
        </div>
      </div>
    </div>
  )
}
