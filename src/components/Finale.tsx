import { RotateCcw } from 'lucide-react'
import type { Artifact } from '../lib/experience'
import { ShapeIcon } from './ShapeIcon'
import { useLanguage } from '../lib/i18n'

export function Achievement({ artifacts }: { artifacts: Artifact[] }) {
  const { t } = useLanguage()

  return (
    <section className="achievement stage-enter" aria-labelledby="achievement-title">
      <span className="system-label">{t.finale.fictionalReport}</span>
      <h1 id="achievement-title">{t.finale.congratulations}</h1>
      <p>{t.finale.completedNotice(artifacts.length || 6)}</p>
      <div className="achievement-stats">
        <div><strong>∞</strong><span>{t.finale.possibilities}</span></div>
        <div><strong>100<small>%</small></strong><span>{t.finale.efficiency}</span></div>
        <div><strong>{String(artifacts.length).padStart(2, '0')}</strong><span>{t.finale.produced}</span></div>
        <div><strong>#1</strong><span>{t.finale.ranking}</span></div>
      </div>
      <div className="achievement-gallery" aria-label="Your generated artifacts">
        {artifacts.map((artifact, index) => (
          <div key={artifact.id}>
            <ShapeIcon type={artifact.game} color={artifact.colors?.[0] || '#D9FF3F'} size={44} />
            <span>{String(index + 1).padStart(2, '0')}</span>
          </div>
        ))}
      </div>
      <small className="achievement-footnote">{t.finale.footnote}</small>
    </section>
  )
}

export function FinalMessage({ step, onReplay }: { step: number; onReplay: () => void }) {
  const { t } = useLanguage()

  return (
    <section className="final-message stage-enter" aria-live="polite">
      <div className="final-statement">
        <p>{t.finale.statement1}</p>
        {step >= 1 && <p className="final-second">{t.finale.statement2}</p>}
      </div>
      {step >= 2 && (
        <div className="final-question">
          <p style={{ whiteSpace: 'pre-line' }}>{t.finale.question}</p>
          <button onClick={onReplay}>
            <RotateCcw size={16} /> {t.finale.replayBtn}
          </button>
        </div>
      )}
      <span className="final-mark">{t.finale.mark}</span>
    </section>
  )
}
