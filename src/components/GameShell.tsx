import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react'
import { GAME_META, type GamePhase, type GameProps, type GameResult, type SoundName } from '../lib/experience'
import { useGameClock } from '../hooks/useGameClock'

type GameShellProps = {
  gameIndex: number
  paused: boolean
  onComplete: (result: GameResult) => void
  playSound: (name: SoundName) => void
  GameComponent: ComponentType<GameProps>
}

const CONSEQUENCE_DURATION = 4 // seconds

export function GameShell({ gameIndex, paused, onComplete, playSound, GameComponent }: GameShellProps) {
  const [score, setScore] = useState(0)
  const [phase, setPhase] = useState<GamePhase>('playing')
  const scoreRef = useRef(0)
  const artifactRef = useRef<GameResult>({ score: 0, label: 'BEGINNER MASTERPIECE', seed: 100 + gameIndex, values: [1] })
  const completedRef = useRef(false)
  const meta = GAME_META[gameIndex]
  const reflectTotal = meta.reflectDuration + 5 // add exactly 5 seconds

  // Game clock only runs during 'playing' phase
  const remaining = useGameClock(24, paused || phase !== 'playing', () => {
    if (phase === 'playing') {
      setPhase('consequence')
    }
  })

  // Consequence phase timer
  useEffect(() => {
    if (phase !== 'consequence' || paused) return
    const timer = window.setTimeout(() => {
      setPhase('reflection')
    }, CONSEQUENCE_DURATION * 1000)
    return () => window.clearTimeout(timer)
  }, [phase, paused])

  // Reflection phase timer
  useEffect(() => {
    if (phase !== 'reflection' || paused) return
    const timer = window.setTimeout(() => {
      if (completedRef.current) return
      completedRef.current = true
      onComplete({ ...artifactRef.current, score: scoreRef.current })
    }, reflectTotal * 1000)
    return () => window.clearTimeout(timer)
  }, [phase, paused, reflectTotal, onComplete])

  const handleScore = useCallback((value: number) => {
    scoreRef.current = value
    setScore(value)
  }, [])
  const handleArtifact = useCallback((result: GameResult) => {
    artifactRef.current = result
  }, [])

  const props: GameProps = {
    paused,
    phase,
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
          <div className={remaining < 6 && phase === 'playing' ? 'time-low' : ''}>
            <span>TIME</span>
            <strong>{phase === 'playing' ? remaining.toFixed(1) : '—'}</strong>
          </div>
        </div>
      </div>
      <p className="game-instruction">
        {phase === 'playing' ? meta.instruction : phase === 'consequence' ? '' : ''}
      </p>
      <div className="playfield">
        <GameComponent {...props} />
        {paused && phase === 'playing' && <div className="paused-stamp">OUTPUT PAUSED</div>}
        {phase === 'reflection' && (
          <div className="reflection-overlay">
            <p className="reflection-text">{meta.question}</p>
          </div>
        )}
      </div>
      <div className="game-footer">
        <span><i className="status-light" /> {phase === 'playing' ? 'ENGINE ACTIVE' : phase === 'consequence' ? 'PROCESSING...' : 'REFLECTING...'}</span>
        <span>ARTIFACT AUTO-SAVED</span>
        <span>NO FAILURE STATES</span>
      </div>
    </section>
  )
}
