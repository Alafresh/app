import { useEffect, useRef, useState } from 'react'

export function useGameClock(duration: number, paused: boolean, onEnd: () => void) {
  const [remaining, setRemaining] = useState(duration)
  const endRef = useRef(onEnd)
  const remainingRef = useRef(duration)
  useEffect(() => {
    endRef.current = onEnd
  }, [onEnd])

  useEffect(() => {
    if (paused) return
    let last = performance.now()
    const timer = window.setInterval(() => {
      const now = performance.now()
      const elapsed = (now - last) / 1000
      last = now
      remainingRef.current = Math.max(0, remainingRef.current - elapsed)
      setRemaining(remainingRef.current)
      if (remainingRef.current <= 0) {
        window.clearInterval(timer)
        endRef.current()
      }
    }, 80)
    return () => window.clearInterval(timer)
  }, [paused, duration])

  return remaining
}
