import { ArrowDownRight, Sparkles } from 'lucide-react'

export function Introduction({ onStart }: { onStart: () => void }) {
  return (
    <main className="intro stage-enter">
      <div className="intro-system system-label"><span className="status-light" /> ARTIFICIAL CREATIVITY ENGINE / READY</div>
      <div className="intro-title">
        <span>EVERYONE</span>
        <span>IS CREATIVE<sup>™</sup></span>
      </div>
      <div className="intro-spec system-label">UNIQUE OBJECT<br />GENERATED FOR YOU<br />SEED 001—∞</div>
      <div className="intro-bottom">
        <div className="intro-copy">
          <span className="system-label">THE AUTOMATED CREATIVITY EXPERIENCE</span>
          <p>Your imagination.<br /><strong>Unlimited output.</strong></p>
          <small>7 experiences · approximately 4 minutes<br />No skill required. Sound optional.</small>
        </div>
        <button className="become-button" onClick={onStart}>
          <span><Sparkles size={20} /> BECOME CREATIVE</span>
          <ArrowDownRight size={34} />
        </button>
      </div>
      <div className="intro-index system-label">AN INTERACTIVE ARTWORK ABOUT MAKING, MULTIPLYING &amp; MEANING</div>
    </main>
  )
}
