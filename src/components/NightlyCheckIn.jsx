import { useState } from 'react'
import './NightlyCheckIn.css'

const STORAGE_KEY = 'oppa-v-line-nightly-checkin'
const ALCOHOL_OPTIONS = ['Yes', 'No', 'Skip']
const SLEEP_HOURS = [4, 5, 6, 7, 8]

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

function loadTodayCheckIn() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    const parsed = JSON.parse(stored)
    return parsed[getTodayKey()] ?? null
  } catch {
    return null
  }
}

function NightlyCheckIn() {
  const existing = loadTodayCheckIn()
  const [alcohol, setAlcohol] = useState(existing?.alcohol ?? null)
  const [hoursSlept, setHoursSlept] = useState(existing?.hoursSlept ?? null)
  const [isComplete, setIsComplete] = useState(Boolean(existing?.completedAt))
  const [saveMessage, setSaveMessage] = useState(
    existing?.completedAt ? 'Day completed and saved.' : '',
  )

  const handleCompleteDay = () => {
    if (alcohol === null) {
      setSaveMessage('Select an alcohol option before completing your day.')
      return
    }

    if (hoursSlept === null) {
      setSaveMessage('Select your hours slept before completing your day.')
      return
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const parsed = stored ? JSON.parse(stored) : {}
      parsed[getTodayKey()] = {
        alcohol,
        hoursSlept,
        completedAt: new Date().toISOString(),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
      setIsComplete(true)
      setSaveMessage('Day completed and saved.')
    } catch {
      setSaveMessage('Could not save your check-in. Please try again.')
    }
  }

  return (
    <section className="nightly-checkin">
      <header className="nightly-checkin__header">
        <h2 className="nightly-checkin__title">Nightly Check-In</h2>
        <p className="nightly-checkin__subtitle">Log today before you rest</p>
      </header>

      <div className="nightly-checkin__card">
        <div className="nightly-checkin__section">
          <h3 className="nightly-checkin__label">Alcohol</h3>
          <div className="nightly-checkin__options" role="group" aria-label="Alcohol">
            {ALCOHOL_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                className={`nightly-checkin__option${alcohol === option ? ' nightly-checkin__option--active' : ''}`}
                onClick={() => setAlcohol(option)}
                aria-pressed={alcohol === option}
              >
                {option}
              </button>
            ))}
          </div>
          <p className="nightly-checkin__info">
            Alcohol triggers next-morning puffiness
          </p>
        </div>

        <div className="nightly-checkin__section">
          <h3 className="nightly-checkin__label">Hours slept</h3>
          <div className="nightly-checkin__options" role="group" aria-label="Hours slept">
            {SLEEP_HOURS.map((hours) => (
              <button
                key={hours}
                type="button"
                className={`nightly-checkin__option nightly-checkin__option--compact${hoursSlept === hours ? ' nightly-checkin__option--active' : ''}`}
                onClick={() => setHoursSlept(hours)}
                aria-pressed={hoursSlept === hours}
              >
                {hours}
              </button>
            ))}
          </div>
          <p className="nightly-checkin__info">
            Under 7 hrs raises cortisol
          </p>
        </div>

        <button
          type="button"
          className="nightly-checkin__complete"
          onClick={handleCompleteDay}
        >
          {isComplete ? 'Update Day' : 'Complete Day'}
        </button>

        {saveMessage && (
          <p
            className={`nightly-checkin__message${isComplete ? ' nightly-checkin__message--success' : ''}`}
            role="status"
          >
            {saveMessage}
          </p>
        )}
      </div>
    </section>
  )
}

export default NightlyCheckIn
