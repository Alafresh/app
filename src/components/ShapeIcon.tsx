export function ShapeIcon({ type, color = '#D9FF3F', size = 64 }: { type: number; color?: string; size?: number }) {
  const rotation = (type * 17) % 45
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" style={{ overflow: 'visible' }}>
      <g transform={`rotate(${rotation} 32 32)`} fill="none" stroke={color} strokeWidth="3">
        {type % 4 === 0 && <><circle cx="32" cy="32" r="20" /><circle cx="32" cy="32" r="7" fill={color} /></>}
        {type % 4 === 1 && <><path d="M32 8 55 50H9Z" /><path d="M32 22v20" /></>}
        {type % 4 === 2 && <><rect x="12" y="12" width="40" height="40" rx={type % 3 ? 0 : 18} /><path d="m20 44 24-24" /></>}
        {type % 4 === 3 && <><path d="M8 32h48M32 8v48" /><circle cx="32" cy="32" r="15" fill="#080808" /></>}
      </g>
    </svg>
  )
}
