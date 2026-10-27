import type { Artifact } from '../lib/experience'
import { ShapeIcon } from './ShapeIcon'
import { useLanguage } from '../lib/i18n'

export function Praise({ gameIndex, artifact }: { gameIndex: number; artifact: Artifact }) {
  const { t } = useLanguage()
  const successTitle = t.games[gameIndex]?.success || '¡INCREÍBLE!'
  const praiseLine = t.praiseLines[gameIndex] || 'Una visión singular.'

  return (
    <section className="praise stage-enter" aria-live="assertive">
      <div className="praise-orbit">
        <ShapeIcon type={gameIndex} color={artifact.colors?.[0] || '#D9FF3F'} size={110} />
      </div>
      <span className="system-label">
        {t.praise.manufactured(gameIndex)}
      </span>
      <h1>{successTitle}</h1>
      <p>{praiseLine}</p>
      <div className="praise-score">
        <span>{t.praise.creativeValue}</span>
        <strong>+{artifact.score * 1000 + 1000}</strong>
      </div>
      <div className="praise-stack" aria-hidden="true">
        {Array.from({ length: Math.min(4, Math.floor(gameIndex / 2)) }, (_, index) => (
          <span key={index}>{t.praise.uniqueSaved(gameIndex + index + 1)}</span>
        ))}
      </div>
    </section>
  )
}
