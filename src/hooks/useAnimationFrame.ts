import { useEffect, useRef } from 'react'

export function useAnimationFrame(callback: (delta: number, time: number) => void, paused = false) {
  const callbackRef = useRef(callback)
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])
  useEffect(() => {
    if (paused) return
    let frame = 0
    let last = performance.now()
    const loop = (now: number) => {
      const delta = Math.min(0.04, (now - last) / 1000)
      last = now
      callbackRef.current(delta, now / 1000)
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [paused])
}
