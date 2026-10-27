import { GAME_META, PRAISE_LINES, type Artifact } from '../lib/experience'
import { ShapeIcon } from './ShapeIcon'

export function Praise({ gameIndex, artifact }: { gameIndex: number; artifact: Artifact }) {
  return (
    <section className="praise stage-enter" aria-live="assertive">
      <div className="praise-orbit"><ShapeIcon type={gameIndex} color={artifact.colors?.[0] || '#D9FF3F'} size={110} /></div>
      <span className="system-label">MASTERPIECE {String(gameIndex + 1).padStart(2, '0')} SUCCESSFULLY MANUFACTURED</span>
      <h1>{GAME_META[gameIndex].success}</h1>
      <p>{PRAISE_LINES[gameIndex]}</p>
      <div className="praise-score"><span>CREATIVE VALUE</span><strong>+{artifact.score * 1000 + 1000}</strong></div>
      <div className="praise-stack" aria-hidden="true">
        {Array.from({ length: Math.min(4, Math.floor(gameIndex / 2)) }, (_, index) => <span key={index}>✓ UNIQUE CREATION SAVED / EDITION {gameIndex + index + 1}</span>)}
      </div>
    </section>
  )
}
