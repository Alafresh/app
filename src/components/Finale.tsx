import { RotateCcw } from 'lucide-react'
import type { Artifact } from '../lib/experience'
import { ShapeIcon } from './ShapeIcon'

export function Achievement({ artifacts }: { artifacts: Artifact[] }) {
  return (
    <section className="achievement stage-enter" aria-labelledby="achievement-title">
      <span className="system-label">FICTIONAL SYSTEM REPORT / NOT A SCIENTIFIC MEASUREMENT</span>
      <h1 id="achievement-title">CONGRATULATIONS!</h1>
      <p>YOU HAVE COMPLETED {artifacts.length || 7} CREATIVE EXPERIENCES.</p>
      <div className="achievement-stats">
        <div><strong>∞</strong><span>POSSIBILITIES GENERATED</span></div>
        <div><strong>100<small>%</small></strong><span>CREATIVE EFFICIENCY</span></div>
        <div><strong>{String(artifacts.length).padStart(2, '0')}</strong><span>MASTERPIECES PRODUCED</span></div>
        <div><strong>#1</strong><span>GLOBAL CREATIVITY RANKING*</span></div>
      </div>
      <div className="achievement-gallery" aria-label="Your generated artifacts">
        {artifacts.map((artifact, index) => <div key={artifact.id}><ShapeIcon type={artifact.game} color={artifact.colors?.[0] || '#D9FF3F'} size={44} /><span>{String(index + 1).padStart(2, '0')}</span></div>)}
      </div>
      <small className="achievement-footnote">*AMONG ALL IMAGINARY PARTICIPANTS IN THIS ARTWORK</small>
    </section>
  )
}

export function FinalMessage({ step, onReplay }: { step: number; onReplay: () => void }) {
  return (
    <section className="final-message stage-enter" aria-live="polite">
      <div className="final-statement">
        <p>Creating is easier than ever.</p>
        {step >= 1 && <p className="final-second">Creating something that truly matters is still just as difficult.</p>}
      </div>
      {step >= 2 && (
        <div className="final-question">
          <p>What would you create<br />if you could create anything?</p>
          <button onClick={onReplay}><RotateCcw size={16} /> EXPERIENCE AGAIN</button>
        </div>
      )}
      <span className="final-mark">EIC™ / ENDLESS OUTPUT, ENDURING QUESTIONS</span>
    </section>
  )
}
