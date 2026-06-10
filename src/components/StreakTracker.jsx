import { PROGRAM_DAYS } from '../lib/streakTracking'
import { useStreakTracker } from '../hooks/useStreakTracker'
import './StreakTracker.css'

function StreakTracker() {
  const { snapshot } = useStreakTracker()
  const {
    completedCount,
    currentDayIndex,
    progressPercent,
    todayComplete,
    graceAvailable,
    programMode,
    maintenanceThisWeek,
    maintenanceWeekStreak,
    isChallengeComplete,
  } = snapshot

  const displayDay = Math.min(completedCount + (todayComplete ? 0 : 1), PROGRAM_DAYS)

  return (
    <section className="streak-tracker" aria-labelledby="streak-tracker-title">
      <header className="streak-tracker__header">
        <h2 id="streak-tracker-title" className="streak-tracker__title">
          {programMode === 'maintenance' ? 'Maintenance Streak' : '42-Day Challenge'}
        </h2>
        <p className="streak-tracker__subtitle">
          {programMode === 'maintenance'
            ? `${maintenanceThisWeek}/3 sessions this week · ${maintenanceWeekStreak} week streak`
            : isChallengeComplete
              ? 'Challenge complete — great work.'
              : `Complete CORE daily · ${graceAvailable ? '1 grace day available' : 'No grace days left'}`}
        </p>
      </header>

      <div className="streak-tracker__card">
        {programMode === 'daily' && (
          <>
            <div className="streak-tracker__progress-meta">
              <span>Day {displayDay} of {PROGRAM_DAYS}</span>
              <span>{completedCount} completed</span>
            </div>
            <div
              className="streak-tracker__progress-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={PROGRAM_DAYS}
              aria-valuenow={completedCount}
              aria-label={`Day ${completedCount} of ${PROGRAM_DAYS}`}
            >
              <span
                className="streak-tracker__progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </>
        )}

        <div className="streak-tracker__grid" aria-label="42 day progress grid">
          {Array.from({ length: PROGRAM_DAYS }, (_, index) => {
            const isFilled = index < completedCount
            const isCurrent = programMode === 'daily'
              && !isChallengeComplete
              && index === currentDayIndex
              && !todayComplete

            return (
              <span
                key={index}
                className={`streak-tracker__dot${isFilled ? ' streak-tracker__dot--filled' : ''}${isCurrent ? ' streak-tracker__dot--current' : ''}`}
                title={`Day ${index + 1}`}
                aria-label={`Day ${index + 1}${isFilled ? ', completed' : isCurrent ? ', current' : ''}`}
              />
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default StreakTracker
