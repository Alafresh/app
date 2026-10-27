import type { SoundName } from './experience'

export class CreativityAudio {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private muted = false
  private saturation = 0

  async unlock() {
    if (!this.context) {
      this.context = new AudioContext()
      this.master = this.context.createGain()
      this.master.gain.value = this.muted ? 0 : 0.2
      this.master.connect(this.context.destination)
    }
    if (this.context.state === 'suspended') await this.context.resume()
  }

  setMuted(muted: boolean) {
    this.muted = muted
    if (this.context && this.master) {
      this.master.gain.cancelScheduledValues(this.context.currentTime)
      this.master.gain.setTargetAtTime(muted ? 0 : 0.2, this.context.currentTime, 0.02)
    }
  }

  setSaturation(value: number) {
    this.saturation = value
  }

  play(name: SoundName) {
    if (!this.context || !this.master || this.muted) return
    const now = this.context.currentTime
    const notes: Record<SoundName, number[]> = {
      tap: [330], score: [660, 990], jump: [260, 520], break: [130, 90],
      shot: [220, 880], success: [440, 554, 659, 880],
    }
    notes[name].forEach((frequency, index) => {
      const oscillator = this.context!.createOscillator()
      const gain = this.context!.createGain()
      const start = now + index * (name === 'success' ? 0.065 : 0.035)
      oscillator.type = name === 'break' ? 'sawtooth' : index % 2 ? 'triangle' : 'sine'
      oscillator.frequency.setValueAtTime(frequency * (1 + this.saturation * 0.0008), start)
      if (name === 'jump') oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.7, start + 0.12)
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(name === 'success' ? 0.17 : 0.25, start + 0.008)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + (name === 'success' ? 0.38 : 0.16))
      oscillator.connect(gain)
      gain.connect(this.master!)
      oscillator.start(start)
      oscillator.stop(start + 0.42)
    })
    if (this.saturation > 55 && (name === 'score' || name === 'success')) {
      this.play('tap')
    }
  }

  silence() {
    if (this.context && this.master) {
      this.master.gain.setTargetAtTime(0, this.context.currentTime, 0.2)
    }
  }

  restore() {
    if (this.context && this.master && !this.muted) {
      this.master.gain.setTargetAtTime(0.2, this.context.currentTime, 0.08)
    }
  }
}
