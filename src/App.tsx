import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { GenerativeWorld } from './components/GenerativeWorld'
import { HUD } from './components/HUD'
import { GameShell } from './components/GameShell'
import { Introduction } from './components/Introduction'
import { Praise } from './components/Praise'
import { Achievement, FinalMessage } from './components/Finale'
import { CreativityAudio } from './lib/audio'
import { GAME_META, type Artifact, type GameResult } from './lib/experience'
import { TowerStack } from './games/TowerStack'
import { ChunkRunner } from './games/ChunkRunner'
import { SnakeGame } from './games/SnakeGame'
import { OneChoice } from './games/OneChoice'
import { ColorFactory } from './games/ColorFactory'
import { BreakEverything } from './games/BreakEverything'
import { Mashup } from './games/Mashup'
import './App.css'

gsap.registerPlugin(useGSAP)

type Stage = 'intro' | 'game' | 'praise' | 'reveal' | 'final'
const gameComponents = [TowerStack, ChunkRunner, SnakeGame, OneChoice, ColorFactory, BreakEverything, Mashup]

export default function App() {
  const [stage, setStage] = useState<Stage>('intro')
  const [gameIndex, setGameIndex] = useState(0)
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [lastArtifact, setLastArtifact] = useState<Artifact | null>(null)
  const [saturationLevel, setSaturationLevel] = useState(0)
  const [paused, setPaused] = useState(false)
  const [muted, setMuted] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [finalStep, setFinalStep] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const [audio] = useState(() => new CreativityAudio())

  const playSound = (name: Parameters<CreativityAudio['play']>[0]) => audio.play(name)

  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.fromTo('.stage-enter', { opacity: 0, scale: 0.985 }, { opacity: 1, scale: 1, duration: 0.55, ease: 'power2.out' })
    if (stage === 'praise') {
      gsap.fromTo('.praise h1', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' })
      gsap.fromTo('.praise-orbit', { rotate: -20, scale: 0.6 }, { rotate: 0, scale: 1, duration: 0.7, ease: 'back.out(1.8)' })
    }
    if (stage === 'final' && finalStep > 0) {
      gsap.fromTo('.final-question, .final-second', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1.1, ease: 'power2.out', stagger: 0.12 })
    }
  }, { scope: rootRef, dependencies: [stage, gameIndex, finalStep], revertOnUpdate: true })

  useEffect(() => {
    audio.setSaturation(saturationLevel)
  }, [saturationLevel, audio])

  useEffect(() => {
    if (stage === 'praise') {
      const timer = window.setTimeout(() => {
        if (gameIndex < 6) {
          setGameIndex((index) => index + 1)
          setStage('game')
        } else {
          setStage('reveal')
        }
      }, 2100)
      return () => window.clearTimeout(timer)
    }
    if (stage === 'reveal') {
      const timer = window.setTimeout(() => {
        setFinalStep(0)
        setStage('final')
        audio.silence()
      }, 5200)
      return () => window.clearTimeout(timer)
    }
    if (stage === 'final') {
      const first = window.setTimeout(() => setFinalStep(1), 2300)
      const second = window.setTimeout(() => setFinalStep(2), 5000)
      return () => { window.clearTimeout(first); window.clearTimeout(second) }
    }
  }, [stage, gameIndex, audio])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (stage === 'game' && (event.code === 'KeyP' || (event.code === 'Escape' && paused))) {
        event.preventDefault()
        setPaused((value) => !value)
      }
    }
    const onFullscreen = () => setFullscreen(Boolean(document.fullscreenElement))
    window.addEventListener('keydown', onKey)
    document.addEventListener('fullscreenchange', onFullscreen)
    return () => { window.removeEventListener('keydown', onKey); document.removeEventListener('fullscreenchange', onFullscreen) }
  }, [stage, paused])

  const start = async () => {
    await audio.unlock()
    audio.restore()
    playSound('success')
    setStage('game')
  }

  const completeGame = (result: GameResult) => {
    const artifact: Artifact = { ...result, game: gameIndex, title: GAME_META[gameIndex].title, id: `${gameIndex}-${Date.now()}` }
    setArtifacts((items) => [...items, artifact])
    setLastArtifact(artifact)
    setSaturationLevel((gameIndex + 1) * (100 / 7))
    setPaused(false)
    setStage('praise')
    playSound('success')
  }

  const replay = () => {
    setArtifacts([]); setLastArtifact(null); setGameIndex(0); setSaturationLevel(0); setFinalStep(0); setPaused(false); setStage('intro')
    audio.restore()
  }

  const toggleMute = () => {
    const next = !muted
    setMuted(next)
    audio.setMuted(next)
    if (!next) { void audio.unlock(); audio.play('tap') }
  }

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen()
    } catch {
      setFullscreen(false)
    }
  }

  const Game = gameComponents[gameIndex]

  return (
    <div ref={rootRef} className={`experience stage-${stage}`}>
      <GenerativeWorld saturation={saturationLevel} artifacts={artifacts} stage={stage} paused={paused} />
      <div className="noise-layer" aria-hidden="true" />
      <HUD
        gameIndex={gameIndex} inGame={stage === 'game'} muted={muted} paused={paused} fullscreen={fullscreen}
        onMute={toggleMute} onPause={() => setPaused((value) => !value)} onFullscreen={() => void toggleFullscreen()}
      />
      {stage === 'intro' && <Introduction onStart={() => void start()} />}
      {stage === 'game' && (
        <main className="game-stage stage-enter">
          <GameShell key={gameIndex} gameIndex={gameIndex} paused={paused} onComplete={completeGame} playSound={playSound} GameComponent={Game} />
          <div className="saturation-meter" aria-label={`Global saturation ${Math.round(saturationLevel)} percent`}>
            <span>GLOBAL OUTPUT SATURATION</span><div><i style={{ width: `${saturationLevel}%` }} /></div><strong>{Math.round(saturationLevel)}%</strong>
          </div>
          {saturationLevel >= 37.5 && <div className="ambient-notices" aria-hidden="true">{Array.from({ length: Math.min(3, Math.floor(saturationLevel / 30)) }, (_, index) => <span key={index}>✓ OUTPUT APPROVED</span>)}</div>}
        </main>
      )}
      {stage === 'praise' && lastArtifact && <Praise gameIndex={gameIndex} artifact={lastArtifact} />}
      {stage === 'reveal' && <Achievement artifacts={artifacts} />}
      {stage === 'final' && <FinalMessage step={finalStep} onReplay={replay} />}
      {paused && stage === 'game' && (
        <div className="pause-overlay" role="dialog" aria-modal="true" aria-labelledby="pause-title" onClick={() => setPaused(false)}>
          <div onClick={(event) => event.stopPropagation()}>
            <span className="system-label">PRODUCTION INTERRUPTED</span>
            <h2 id="pause-title">OUTPUT CAN WAIT.</h2>
            <p>The timer is paused. Your almost-masterpieces are safe.</p>
            <button autoFocus onClick={() => setPaused(false)}>RESUME CREATING</button>
            <small>Press P or ESC to resume</small>
          </div>
        </div>
      )}
    </div>
  )
}
