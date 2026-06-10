import { useEffect, useState } from 'react'
import { formatRecommendedTime } from '../lib/exercises'
import './ExerciseTimer.css'

function formatClock(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function ExerciseTimer({ recommendedSeconds, label = 'Recommended time' }) {
  const [remaining, setRemaining] = useState(recommendedSeconds)
  const [isRunning, setIsRunning] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    setRemaining(recommendedSeconds)
    setIsRunning(false)
    setIsComplete(false)
  }, [recommendedSeconds])

  useEffect(() => {
    if (!isRunning || remaining <= 0) return undefined

    const timerId = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setIsRunning(false)
          setIsComplete(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => window.clearInterval(timerId)
  }, [isRunning, remaining])

  const handleReset = () => {
    setRemaining(recommendedSeconds)
    setIsRunning(false)
    setIsComplete(false)
  }

  return (
    <div className="exercise-timer">
      <div className="exercise-timer__header">
        <p className="exercise-timer__label">{label}</p>
        <p className="exercise-timer__recommended">
          Goal: {formatRecommendedTime(recommendedSeconds)}
        </p>
      </div>

      <p
        className={`exercise-timer__display${isComplete ? ' exercise-timer__display--done' : ''}`}
        aria-live="polite"
      >
        {formatClock(remaining)}
      </p>

      <div className="exercise-timer__actions">
        <button
          type="button"
          className="exercise-timer__btn exercise-timer__btn--primary"
          onClick={() => setIsRunning((prev) => !prev)}
          disabled={isComplete}
        >
          {isRunning ? 'Pause' : remaining < recommendedSeconds ? 'Resume' : 'Start Timer'}
        </button>
        <button
          type="button"
          className="exercise-timer__btn"
          onClick={handleReset}
        >
          Reset
        </button>
      </div>

      {isComplete && (
        <p className="exercise-timer__complete" role="status">
          Recommended time complete.
        </p>
      )}
    </div>
  )
}

export default ExerciseTimer
