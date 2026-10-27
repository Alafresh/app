import { useEffect, useMemo, useRef, useState } from 'react'
import { PALETTE, seeded, type GameProps } from '../lib/experience'
import { ShapeIcon } from '../components/ShapeIcon'

type Card = { pair: number; id: number; color: string }

export function CopyPaste({ onScore, onArtifact, playSound }: GameProps) {
  const cards = useMemo<Card[]>(() => {
    const random = seeded(707)
    const deck = Array.from({ length: 12 }, (_, id) => ({ id, pair: Math.floor(id / 2), color: PALETTE[Math.floor(id / 2) % 3] }))
    for (let i = deck.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]
    }
    return deck
  }, [])
  const [flipped, setFlipped] = useState<number[]>([])
  const [matched, setMatched] = useState<number[]>([])
  const [matches, setMatches] = useState(0)
  const timeoutRef = useRef<number | null>(null)
  useEffect(() => () => { if (timeoutRef.current) window.clearTimeout(timeoutRef.current) }, [])

  const flip = (id: number) => {
    if (flipped.length >= 2 || flipped.includes(id) || matched.includes(id)) return
    const next = [...flipped, id]
    setFlipped(next)
    playSound('tap')
    if (next.length === 2) {
      const first = cards.find((card) => card.id === next[0])!
      const second = cards.find((card) => card.id === next[1])!
      if (first.pair === second.pair) {
        timeoutRef.current = window.setTimeout(() => {
          const nextMatched = [...matched, ...next]
          const nextMatches = matches + 1
          setMatched(nextMatched); setFlipped([]); setMatches(nextMatches)
          const score = nextMatches * 100
          onScore(score); playSound('score')
          onArtifact({ score, label: `ORIGINALS / ${nextMatches} PAIRS`, seed: 707 + nextMatches, values: [nextMatches, nextMatched.length, first.pair] })
          if (nextMatches === 6) {
            setMatched([]); setMatches(0)
          }
        }, 420)
      } else {
        timeoutRef.current = window.setTimeout(() => setFlipped([]), 680)
      }
    }
  }

  return (
    <div className="matching-game">
      <div className="matching-status"><span>UNIQUE CREATIONS: 12</span><span>MATCHES: {matches}</span></div>
      <div className="card-grid">
        {cards.map((card) => {
          const visible = flipped.includes(card.id) || matched.includes(card.id)
          return (
            <button key={card.id} className={`matching-card ${visible ? 'is-flipped' : ''} ${matched.includes(card.id) ? 'is-matched' : ''}`} onClick={() => flip(card.id)} aria-label={visible ? `Pattern ${card.pair + 1}` : `Reveal unique creation ${card.id + 1}`}>
              <span className="card-back"><b>UNIQUE</b><small>#{String(card.id + 1).padStart(3, '0')}</small></span>
              <span className="card-front"><ShapeIcon type={card.pair} color={card.color} size={52} /><small>PATTERN {String.fromCharCode(65 + card.pair)}</small></span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
