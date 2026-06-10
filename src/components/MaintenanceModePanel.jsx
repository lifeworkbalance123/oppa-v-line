import { useState } from 'react'
import {
  MAINTENANCE_SESSIONS_PER_WEEK,
  setProgramMode,
} from '../lib/streakTracking'
import { useStreakTracker } from '../hooks/useStreakTracker'
import './MaintenanceModePanel.css'

function MaintenanceModePanel() {
  const { snapshot, refresh } = useStreakTracker()
  const [message, setMessage] = useState('')
  const { programMode, maintenanceThisWeek, isChallengeComplete } = snapshot

  if (!isChallengeComplete && programMode !== 'maintenance') {
    return null
  }

  const handleToggleMode = (mode) => {
    setProgramMode(mode)
    refresh()
    setMessage(mode === 'maintenance'
      ? 'Maintenance mode enabled — aim for 3 sessions per week.'
      : 'Daily challenge mode restored.')
  }

  return (
    <section className="maintenance-panel" aria-labelledby="maintenance-panel-title">
      <header className="maintenance-panel__header">
        <h2 id="maintenance-panel-title" className="maintenance-panel__title">
          Program Mode
        </h2>
        <p className="maintenance-panel__subtitle">
          {programMode === 'maintenance'
            ? `Maintenance schedule: 3 exercises, ${MAINTENANCE_SESSIONS_PER_WEEK}x per week`
            : 'Daily CORE challenge active'}
        </p>
      </header>

      <div className="maintenance-panel__card">
        {programMode === 'maintenance' && (
          <p className="maintenance-panel__stat">
            This week: {maintenanceThisWeek}/{MAINTENANCE_SESSIONS_PER_WEEK} sessions logged
          </p>
        )}

        <div className="maintenance-panel__actions">
          <button
            type="button"
            className={`maintenance-panel__btn${programMode === 'daily' ? ' maintenance-panel__btn--active' : ''}`}
            onClick={() => handleToggleMode('daily')}
          >
            Daily Mode
          </button>
          <button
            type="button"
            className={`maintenance-panel__btn${programMode === 'maintenance' ? ' maintenance-panel__btn--active' : ''}`}
            onClick={() => handleToggleMode('maintenance')}
          >
            Maintenance Mode
          </button>
        </div>

        {message && (
          <p className="maintenance-panel__message" role="status">
            {message}
          </p>
        )}
      </div>
    </section>
  )
}

export default MaintenanceModePanel
