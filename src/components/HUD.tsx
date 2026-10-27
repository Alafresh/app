import { Maximize2, Minimize2, Pause, Play, Volume2, VolumeX } from 'lucide-react'

type HUDProps = {
  gameIndex: number
  inGame: boolean
  muted: boolean
  paused: boolean
  fullscreen: boolean
  onMute: () => void
  onPause: () => void
  onFullscreen: () => void
}

export function HUD({ gameIndex, inGame, muted, paused, fullscreen, onMute, onPause, onFullscreen }: HUDProps) {
  return (
    <header className="global-hud">
      <div className="brand-mark" aria-label="Everyone is Creative">
        <span className="brand-dot" /> EIC<span className="brand-tm">™</span>
      </div>
      {inGame && (
        <div className="progress-track" aria-label={`Experience ${gameIndex + 1} of 8`}>
          {Array.from({ length: 8 }, (_, index) => (
            <span key={index} className={index < gameIndex ? 'is-done' : index === gameIndex ? 'is-current' : ''} />
          ))}
        </div>
      )}
      <div className="hud-actions">
        {inGame && (
          <button className="icon-button" onClick={onPause} aria-label={paused ? 'Resume experience' : 'Pause experience'} title={paused ? 'Resume (P)' : 'Pause (P)'}>
            {paused ? <Play size={18} /> : <Pause size={18} />}
          </button>
        )}
        <button className="icon-button" onClick={onMute} aria-label={muted ? 'Unmute sound' : 'Mute sound'} title={muted ? 'Sound off' : 'Sound on'}>
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <button className="icon-button fullscreen-button" onClick={onFullscreen} aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'} title="Fullscreen">
          {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      </div>
    </header>
  )
}
