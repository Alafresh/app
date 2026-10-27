import { ArrowDownRight, Sparkles } from 'lucide-react'
import { useLanguage } from '../lib/i18n'

export function Introduction({ onStart }: { onStart: () => void }) {
  const { t } = useLanguage()

  return (
    <main className="intro stage-enter">
      <div className="intro-system system-label">
        <span className="status-light" /> {t.intro.systemReady}
      </div>
      <div className="intro-title">
        <span>{t.intro.brandTop}</span>
        <span>{t.intro.brandBottom}<sup>™</sup></span>
      </div>
      <div className="intro-spec system-label">
        {t.intro.uniqueObject}<br />
        {t.intro.generatedForYou}<br />
        {t.intro.seed}
      </div>
      <div className="intro-bottom">
        <div className="intro-copy">
          <span className="system-label">{t.intro.tagline}</span>
          <p>{t.intro.heroPrimary}<br /><strong>{t.intro.heroHighlight}</strong></p>
          <small style={{ whiteSpace: 'pre-line' }}>{t.intro.specs}</small>
        </div>
        <button className="become-button" onClick={onStart}>
          <span><Sparkles size={20} /> {t.intro.startBtn}</span>
          <ArrowDownRight size={34} />
        </button>
      </div>
      <div className="intro-index system-label">
        {t.intro.footerIndex}
      </div>
    </main>
  )
}
