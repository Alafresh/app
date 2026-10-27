import { Maximize2, Minimize2, Pause, Play, Volume2, VolumeX } from 'lucide-react'
import { GAME_META } from '../lib/experience'
import { useLanguage } from '../lib/i18n'

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
  const { lang, setLang, t } = useLanguage()
  const totalGames = GAME_META.length

  return (
    <header className="global-hud">
      <div className="brand-mark" aria-label="Everyone is Creative">
        <span className="brand-dot" /> EIC<span className="brand-tm">™</span>
      </div>
      {inGame && (
        <div className="progress-track" aria-label={t.hud.experienceOf(gameIndex + 1, totalGames)}>
          {Array.from({ length: totalGames }, (_, index) => (
            <span key={index} className={index < gameIndex ? 'is-done' : index === gameIndex ? 'is-current' : ''} />
          ))}
        </div>
      )}
      <div className="hud-actions">
        {/* Language selector positioned next to audio control */}
        <div className="language-selector" role="group" aria-label={t.hud.langSelectorLabel}>
          <button
            type="button"
            className={`lang-btn ${lang === 'es' ? 'is-active' : ''}`}
            onClick={() => setLang('es')}
            aria-pressed={lang === 'es'}
            title="Cambiar a Español"
          >
            ESPAÑOL
          </button>
          <span className="lang-divider" aria-hidden="true">/</span>
          <button
            type="button"
            className={`lang-btn ${lang === 'en' ? 'is-active' : ''}`}
            onClick={() => setLang('en')}
            aria-pressed={lang === 'en'}
            title="Switch to English"
          >
            ENGLISH
          </button>
        </div>

        {inGame && (
          <button
            className="icon-button"
            onClick={onPause}
            aria-label={paused ? t.hud.resume : t.hud.pause}
            title={paused ? t.hud.resume : t.hud.pause}
          >
            {paused ? <Play size={18} /> : <Pause size={18} />}
          </button>
        )}
        <button
          className="icon-button"
          onClick={onMute}
          aria-label={muted ? t.hud.soundOn : t.hud.soundOff}
          title={muted ? t.hud.soundOn : t.hud.soundOff}
        >
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <button
          className="icon-button fullscreen-button"
          onClick={onFullscreen}
          aria-label={fullscreen ? t.hud.exitFullscreen : t.hud.fullscreen}
          title={fullscreen ? t.hud.exitFullscreen : t.hud.fullscreen}
        >
          {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      </div>
    </header>
  )
}
