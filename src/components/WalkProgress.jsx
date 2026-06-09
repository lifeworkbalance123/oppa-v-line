import { useEffect, useState } from 'react'
import './WalkProgress.css'

const STORAGE_KEY = 'oppa-v-line-walk-progress'
const STEP_GOAL = 3000
const STEP_INCREMENT = 100

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

function loadSteps() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return 0
    const parsed = JSON.parse(stored)
    return Math.max(0, Number(parsed[getTodayKey()]) || 0)
  } catch {
    return 0
  }
}

function WalkProgress() {
  const [steps, setSteps] = useState(loadSteps)

  const stepsRemaining = Math.max(0, STEP_GOAL - steps)
  const goalReached = steps >= STEP_GOAL

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const parsed = stored ? JSON.parse(stored) : {}
      parsed[getTodayKey()] = steps
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
    } catch {
      // Ignore storage errors.
    }
  }, [steps])

  const updateSteps = (delta) => {
    setSteps((prev) => Math.max(0, prev + delta))
  }

  return (
    <section className="walk-progress">
      <header className="walk-progress__header">
        <h2 className="walk-progress__title">Walk Progress</h2>
        <p className="walk-progress__goal">Morning goal: {STEP_GOAL.toLocaleString()} steps</p>
      </header>

      <div className="walk-progress__card">
        <div className="walk-progress__counter">
          <button
            type="button"
            className="walk-progress__btn"
            onClick={() => updateSteps(-STEP_INCREMENT)}
            disabled={steps === 0}
            aria-label={`Remove ${STEP_INCREMENT} steps`}
          >
            −
          </button>
          <div className="walk-progress__count">
            <span className="walk-progress__count-value">
              {steps.toLocaleString()}
            </span>
            <span className="walk-progress__count-label">steps today</span>
          </div>
          <button
            type="button"
            className="walk-progress__btn"
            onClick={() => updateSteps(STEP_INCREMENT)}
            aria-label={`Add ${STEP_INCREMENT} steps`}
          >
            +
          </button>
        </div>

        <p className="walk-progress__remaining">
          {goalReached
            ? 'Morning goal reached. Great work.'
            : `${stepsRemaining.toLocaleString()} steps remaining`}
        </p>

        {!goalReached && (
          <p className="walk-progress__tip">
            Try getting off one bus stop early
          </p>
        )}
      </div>
    </section>
  )
}

export default WalkProgress
