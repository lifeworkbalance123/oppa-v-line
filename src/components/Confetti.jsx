import { useEffect, useMemo, useState } from 'react'
import './Confetti.css'

const COLORS = ['#3a7352', '#2d5a3f', '#c9a227', '#4a90d9', '#ffffff']

function Confetti() {
  const [active, setActive] = useState(true)

  const pieces = useMemo(
    () => Array.from({ length: 48 }, (_, index) => ({
      id: index,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 2}s`,
      duration: `${2.5 + Math.random() * 2}s`,
      color: COLORS[index % COLORS.length],
      size: `${6 + Math.random() * 8}px`,
    })),
    [],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => setActive(false), 5000)
    return () => window.clearTimeout(timer)
  }, [])

  if (!active) return null

  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="confetti__piece"
          style={{
            left: piece.left,
            animationDelay: piece.delay,
            animationDuration: piece.duration,
            backgroundColor: piece.color,
            width: piece.size,
            height: piece.size,
          }}
        />
      ))}
    </div>
  )
}

export default Confetti
