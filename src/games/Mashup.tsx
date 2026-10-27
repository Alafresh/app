import { useState } from 'react'
import { Cpu, Network, CheckCircle2 } from 'lucide-react'
import { PALETTE, type GameProps } from '../lib/experience'

type Purpose = {
  id: number
  title: string
  desc: string
}

const PURPOSES: Purpose[] = [
  {
    id: 0,
    title: 'DECENTRALIZED COMMUNICATION GRID',
    desc: 'Mycelial tree root pathways transmitting low-voltage digital network packets.',
  },
  {
    id: 1,
    title: 'SELF-HEALING ENERGY CAPACITOR',
    desc: 'Organic sap conduits providing biological electrolyte storage for microchips.',
  },
  {
    id: 2,
    title: 'DISTRIBUTED SENSOR MATRIX',
    desc: 'Subterranean root tips functioning as autonomous environmental probe nodes.',
  },
]

export function Mashup({ phase, onScore, onArtifact, playSound }: GameProps) {
  const [selectedPurpose, setSelectedPurpose] = useState<number | null>(null)
  const isPostGame = phase === 'consequence' || phase === 'reflection'

  const choosePurpose = (id: number) => {
    if (phase !== 'playing') return
    setSelectedPurpose(id)
    onScore(100)
    onArtifact({
      score: 100,
      label: `HYBRID / ROOT × CIRCUIT`,
      seed: 808 + id * 19,
      values: [id, 2, 3],
      colors: [PALETTE[id % 3]],
    })
    playSound('combine')
  }

  // Render SVG procedural representation for a given purpose
  const renderGeometry = (purposeId: number, isSelected: boolean) => {
    return (
      <svg viewBox="0 0 240 180" role="img" aria-label={PURPOSES[purposeId].title}>
        <g transform="translate(120, 90)">
          {/* Concept A: Root tendrils */}
          {Array.from({ length: 8 }, (_, i) => {
            const angle = (i / 8) * Math.PI * 2
            const r = 40 + (i % 3) * 14
            return (
              <path
                key={i}
                d={`M0,0 Q${Math.cos(angle) * r * 0.5},${Math.sin(angle) * r * 0.5} ${Math.cos(angle) * r},${Math.sin(angle) * r}`}
                fill="none"
                stroke={isSelected ? '#D9FF3F' : 'rgba(217,255,63,0.45)'}
                strokeWidth={2 + (i % 2)}
              />
            )
          })}

          {/* Concept B & Purpose geometry */}
          {purposeId === 0 && (
            /* Communication Grid: bus traces and network packets */
            <>
              <rect x="-30" y="-30" width="60" height="60" fill="#080808" stroke="#55DDE0" strokeWidth="2.5" />
              <path d="M-22,-22 L22,22 M-22,22 L22,-22" stroke="#55DDE0" strokeWidth="1.5" strokeDasharray="3,3" />
              <circle cx="-15" cy="-15" r="4" fill="#F33DBA" />
              <circle cx="15" cy="15" r="4" fill="#F33DBA" />
              <circle cx="0" cy="0" r="8" fill="#D9FF3F" />
            </>
          )}

          {purposeId === 1 && (
            /* Energy Storage: concentric coils and central capacitor cell */
            <>
              <circle r="36" fill="none" stroke="#F33DBA" strokeWidth="2" strokeDasharray="6,4" />
              <circle r="24" fill="none" stroke="#FFFFFF" strokeWidth="2" />
              <circle r="14" fill="#F33DBA" />
              <path d="M-8,0 H8 M0,-8 V8" stroke="#080808" strokeWidth="2.5" />
            </>
          )}

          {purposeId === 2 && (
            /* Sensor Matrix: telemetry probes and radar pulses */
            <>
              <polygon points="0,-36 36,0 0,36 -36,0" fill="#080808" stroke="#FFFFFF" strokeWidth="2" />
              <circle r="18" fill="none" stroke="#55DDE0" strokeWidth="2" strokeDasharray="2,3" />
              <circle cx="0" cy="-36" r="4" fill="#D9FF3F" />
              <circle cx="36" cy="0" r="4" fill="#D9FF3F" />
              <circle cx="0" cy="36" r="4" fill="#D9FF3F" />
              <circle cx="-36" cy="0" r="4" fill="#D9FF3F" />
              <circle r="6" fill="#F33DBA" />
            </>
          )}
        </g>
      </svg>
    )
  }

  return (
    <div className="mashup-game" style={isPostGame ? { display: 'flex', flexDirection: 'column' } : {}}>
      {!isPostGame ? (
        <>
          {/* Left panel: Two concepts & 3 purposes */}
          <div className="idea-bank" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <span className="system-label" style={{ color: '#D9FF3F' }}>STARTING CONCEPTS (A × B)</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                <div style={{ border: '1px solid #444', padding: '10px 12px', background: '#111' }}>
                  <Network size={20} color="#D9FF3F" />
                  <strong style={{ display: 'block', fontSize: 13, marginTop: 4 }}>TREE ROOT</strong>
                  <span style={{ fontSize: 11, color: '#888' }}>Subterranean biological conduit</span>
                </div>
                <div style={{ border: '1px solid #444', padding: '10px 12px', background: '#111' }}>
                  <Cpu size={20} color="#55DDE0" />
                  <strong style={{ display: 'block', fontSize: 13, marginTop: 4 }}>CIRCUIT</strong>
                  <span style={{ fontSize: 11, color: '#888' }}>Engineered logic trace</span>
                </div>
              </div>
            </div>

            <div>
              <span className="system-label">CHOOSE A PURPOSE FOR SYNTHESIS:</span>
              <div className="purpose-list">
                {PURPOSES.map((p) => {
                  const isSelected = selectedPurpose === p.id
                  return (
                    <button
                      key={p.id}
                      className={`purpose-button ${isSelected ? 'selected' : ''}`}
                      onClick={() => choosePurpose(p.id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong>{p.title}</strong>
                        {isSelected && <CheckCircle2 size={16} color="#D9FF3F" />}
                      </div>
                      <span>{p.desc}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right panel: Synthesis result */}
          <div className="mashup-lab">
            <div className="mashup-slots">
              <span>TREE ROOT</span>
              <b>×</b>
              <span>ELECTRONIC CIRCUIT</span>
            </div>

            <div className={`mashup-result ${selectedPurpose !== null ? 'has-result' : ''}`}>
              {selectedPurpose !== null ? (
                <>
                  {renderGeometry(selectedPurpose, true)}
                  <strong>{PURPOSES[selectedPurpose].title}</strong>
                  <span>DECISION MADE: PURPOSE COMMITTED</span>
                </>
              ) : (
                <span>SELECT A PURPOSE ON THE LEFT TO DIRECT THE CREATIVE OUTCOME</span>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Post-game Visual Consequence: 3 Interpretations side-by-side */
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between' }}>
            <span className="system-label" style={{ color: '#D9FF3F' }}>
              ⚡ SAME STARTING INGREDIENTS → 3 DISTINCT VALUE INTERPRETATIONS
            </span>
            <span className="system-label">SELECTION &gt; RAW GENERATION</span>
          </div>

          <div className="mashup-variations-grid">
            {PURPOSES.map((p) => {
              const isChosen = selectedPurpose === p.id || (selectedPurpose === null && p.id === 0)
              return (
                <div key={p.id} className={`mashup-variation-card ${isChosen ? 'chosen' : ''}`}>
                  <span className="system-label" style={{ color: isChosen ? '#D9FF3F' : '#888' }}>
                    {isChosen ? '★ PURSUED PURPOSE' : 'ALTERNATIVE INTERPRETATION'}
                  </span>
                  {renderGeometry(p.id, isChosen)}
                  <strong style={{ color: isChosen ? '#D9FF3F' : '#fff' }}>{p.title}</strong>
                  <span style={{ marginTop: 4 }}>{p.desc}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
