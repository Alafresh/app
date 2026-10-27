import { useCallback, useRef, useState, type ComponentType } from 'react'
import { GAME_META, type GameProps, type GameResult, type SoundName } from '../lib/experience'
import { useGameClock } from '../hooks/useGameClock'

type GameShellProps = {
  gameIndex: number
  paused: boolean
  onComplete: (result: GameResult) => void
  playSound: (name: SoundName) => void
  GameComponent: ComponentType<GameProps>
}

export function GameShell({ gameIndex, paused, onComplete, playSound, GameComponent }: GameShellProps) {
  const [score, setScore] = useState(0)
  const scoreRef = useRef(0)
  const artifactRef = useRef<GameResult>({ score: 0, label: 'BEGINNER MASTERPIECE', seed: 100 + gameIndex, values: [1] })
  const endedRef = useRef(false)
  const meta = GAME_META[gameIndex]

  const remaining = useGameClock(24, paused, () => {
    if (endedRef.current) return
    endedRef.current = true
    onComplete({ ...artifactRef.current, score: scoreRef.current })
  })

  const handleScore = useCallback((value: number) => {
    scoreRef.current = value
    setScore(value)
  }, [])
  const handleArtifact = useCallback((result: GameResult) => {
    artifactRef.current = result
  }, [])
  const props: GameProps = {
    paused,
    onScore: handleScore,
    onArtifact: handleArtifact,
    playSound,
  }

  return (
    <section className="game-shell" aria-labelledby="game-title">
      <div className="game-heading">
        <div>
          <span className="system-label">CREATIVE OLYMPICS / {String(gameIndex + 1).padStart(2, '0')}</span>
          <h1 id="game-title">{meta.title}</h1>
        </div>
        <div className="game-metrics" aria-live="polite">
          <div><span>SCORE</span><strong>{String(score).padStart(4, '0')}</strong></div>
          <div className={remaining < 6 ? 'time-low' : ''}><span>TIME</span><strong>{remaining.toFixed(1)}</strong></div>
        </div>
      </div>
      <p className="game-instruction">{meta.instruction}</p>
      <div className="playfield">
        <GameComponent {...props} />
        {paused && <div className="paused-stamp">OUTPUT PAUSED</div>}
      </div>
      <div className="game-footer">
        <span><i className="status-light" /> ENGINE ACTIVE</span>
        <span>ARTIFACT AUTO-SAVED</span>
        <span>NO FAILURE STATES</span>
      </div>
    </section>
  )
}
