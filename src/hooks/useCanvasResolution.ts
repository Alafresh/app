import { useEffect, useState, type RefObject } from 'react'

export function useCanvasResolution(ref: RefObject<HTMLCanvasElement | null>) {
  const [size, setSize] = useState({ width: 800, height: 450, dpr: 1 })
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio, 2)
      canvas.width = Math.max(1, Math.round(rect.width * dpr))
      canvas.height = Math.max(1, Math.round(rect.height * dpr))
      const context = canvas.getContext('2d')
      context?.setTransform(dpr, 0, 0, dpr, 0, 0)
      setSize({ width: rect.width, height: rect.height, dpr })
    }
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    resize()
    return () => observer.disconnect()
  }, [ref])
  return size
}
