import { useEffect, useMemo, useState } from 'react'
import { formatRecommendedTime, getRecommendedSeconds, LIBRARY_EXERCISES } from '../lib/exercises'
import {
  EXERCISE_SETTINGS_KEY,
  EXERCISE_SETTINGS_UPDATED_EVENT,
  resolveExerciseMedia,
} from '../lib/exerciseSettings'
import ExerciseTimer from './ExerciseTimer'
import VideoWithFallback from './VideoWithFallback'
import './ExerciseLibrary.css'

const STORAGE_KEY = 'oppa-v-line-library-progress'
const EXERCISES = LIBRARY_EXERCISES

function createEmptyProgress() {
  return EXERCISES.reduce((acc, exercise) => {
    acc[exercise.id] = Array(exercise.sets).fill(false)
    return acc
  }, {})
}

function loadProgress() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return createEmptyProgress()

    const parsed = JSON.parse(stored)
    const base = createEmptyProgress()

    EXERCISES.forEach((exercise) => {
      const saved = parsed[exercise.id]
      if (Array.isArray(saved)) {
        base[exercise.id] = Array.from({ length: exercise.sets }, (_, index) =>
          Boolean(saved[index]),
        )
      }
    })

    return base
  } catch {
    return createEmptyProgress()
  }
}

function ExerciseCard({
  exercise,
  completedSets,
  mode,
  onModeChange,
  onToggleSet,
  settingsTick,
  isExpanded,
  onToggleExpand,
  asSection,
}) {
  const media = useMemo(
    () => resolveExerciseMedia(exercise),
    [exercise, settingsTick],
  )
  const recommendedLabel = formatRecommendedTime(getRecommendedSeconds(exercise))
  const completedCount = completedSets.filter(Boolean).length
  const isComplete = completedCount === exercise.sets

  if (asSection && !isExpanded) {
    return (
      <article className="exercise-library__row-card">
        <button
          type="button"
          className="exercise-library__row"
          onClick={onToggleExpand}
        >
          <span className="exercise-library__row-icon" aria-hidden="true">
            ▶
          </span>
          <span className="exercise-library__row-info">
            <span className="exercise-library__name">{exercise.name}</span>
            <span className="exercise-library__meta">
              {exercise.sets} sets · {exercise.metric} · Timer: {recommendedLabel}
            </span>
          </span>
          <span className="exercise-library__progress-badge">
            {completedCount}/{exercise.sets}
          </span>
        </button>
      </article>
    )
  }

  return (
    <article
      className={`exercise-library__card${isComplete ? ' exercise-library__card--done' : ''}`}
    >
      <header className="exercise-library__card-header">
        <div>
          <h3 className="exercise-library__name">{exercise.name}</h3>
          <p className="exercise-library__meta">
            {exercise.sets} sets · {exercise.metric} · Timer: {recommendedLabel}
          </p>
        </div>
        <div className="exercise-library__card-actions">
          {asSection && (
            <button
              type="button"
              className="exercise-library__collapse"
              onClick={onToggleExpand}
              aria-label={`Collapse ${exercise.name}`}
            >
              ×
            </button>
          )}
          <span className="exercise-library__progress-badge">
            {completedCount}/{exercise.sets}
          </span>
        </div>
      </header>

      <div
        className="exercise-library__toggle"
        role="tablist"
        aria-label={`${exercise.name} mode`}
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'demo'}
          className={`exercise-library__toggle-btn${mode === 'demo' ? ' exercise-library__toggle-btn--active' : ''}`}
          onClick={() => onModeChange('demo')}
        >
          Watch Demo
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'doit'}
          className={`exercise-library__toggle-btn${mode === 'doit' ? ' exercise-library__toggle-btn--active' : ''}`}
          onClick={() => onModeChange('doit')}
        >
          Do It
        </button>
      </div>

      {mode === 'demo' ? (
        <>
          <ExerciseTimer recommendedSeconds={getRecommendedSeconds(exercise)} />
          <VideoWithFallback
            exerciseName={exercise.name}
            youtubeUrl={media.youtubeUrl}
            mp4Url={media.mp4Url}
            anatomyImageUrl={media.anatomyImageUrl}
            steps={exercise.steps}
          />
        </>
      ) : (
        <>
          <ExerciseTimer recommendedSeconds={getRecommendedSeconds(exercise)} />
        <div className="exercise-library__sets" role="group" aria-label={`${exercise.name} sets`}>
          {Array.from({ length: exercise.sets }, (_, index) => {
            const setNumber = index + 1
            const isSetComplete = completedSets[index]

            return (
              <label
                key={`${exercise.id}-set-${setNumber}`}
                className={`exercise-library__set${isSetComplete ? ' exercise-library__set--done' : ''}`}
              >
                <input
                  type="checkbox"
                  className="exercise-library__checkbox"
                  checked={isSetComplete}
                  onChange={() => onToggleSet(index)}
                  aria-label={`Set ${setNumber} of ${exercise.sets} for ${exercise.name}`}
                />
                <span className="exercise-library__set-label">
                  Set {setNumber}
                </span>
                <span className="exercise-library__set-metric">{exercise.metric}</span>
              </label>
            )
          })}
        </div>
        </>
      )}
    </article>
  )
}

function ExerciseLibrary({ asSection = false }) {
  const [progress, setProgress] = useState(loadProgress)
  const [settingsTick, setSettingsTick] = useState(0)
  const [expandedId, setExpandedId] = useState(null)
  const [modes, setModes] = useState(
    () => EXERCISES.reduce((acc, exercise) => {
      acc[exercise.id] = 'demo'
      return acc
    }, {}),
  )

  useEffect(() => {
    const refreshMedia = () => setSettingsTick((tick) => tick + 1)

    const handleStorage = (event) => {
      if (event.key === EXERCISE_SETTINGS_KEY) {
        refreshMedia()
      }
    }

    window.addEventListener('focus', refreshMedia)
    window.addEventListener(EXERCISE_SETTINGS_UPDATED_EVENT, refreshMedia)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('focus', refreshMedia)
      window.removeEventListener(EXERCISE_SETTINGS_UPDATED_EVENT, refreshMedia)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  const overallProgress = useMemo(() => {
    const totalSets = EXERCISES.reduce((sum, exercise) => sum + exercise.sets, 0)
    const completedSets = EXERCISES.reduce(
      (sum, exercise) => sum + progress[exercise.id].filter(Boolean).length,
      0,
    )
    return { completedSets, totalSets }
  }, [progress])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  }, [progress])

  const handleModeChange = (exerciseId, mode) => {
    setModes((prev) => ({ ...prev, [exerciseId]: mode }))
  }

  const handleToggleSet = (exerciseId, setIndex) => {
    setProgress((prev) => {
      const updatedSets = [...prev[exerciseId]]
      updatedSets[setIndex] = !updatedSets[setIndex]
      return { ...prev, [exerciseId]: updatedSets }
    })
  }

  const handleToggleExpand = (exerciseId) => {
    setExpandedId((prev) => (prev === exerciseId ? null : exerciseId))
    handleModeChange(exerciseId, 'demo')
  }

  return (
    <section className={`exercise-library${asSection ? ' exercise-library--section' : ''}`}>
      <header className="exercise-library__header">
        {asSection ? (
          <>
            <h2 className="exercise-library__section-title">EXERCISES</h2>
            <p className="exercise-library__summary">
              Tap ▶ to watch demo · {overallProgress.completedSets}/{overallProgress.totalSets} sets
            </p>
          </>
        ) : (
          <>
            <h1 className="exercise-library__title">Exercise Library</h1>
            <p className="exercise-library__summary">
              {overallProgress.completedSets}/{overallProgress.totalSets} sets completed
            </p>
          </>
        )}
      </header>

      <div className="exercise-library__list">
        {EXERCISES.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            completedSets={progress[exercise.id]}
            mode={modes[exercise.id]}
            onModeChange={(mode) => handleModeChange(exercise.id, mode)}
            onToggleSet={(setIndex) => handleToggleSet(exercise.id, setIndex)}
            settingsTick={settingsTick}
            asSection={asSection}
            isExpanded={expandedId === exercise.id}
            onToggleExpand={() => handleToggleExpand(exercise.id)}
          />
        ))}
      </div>
    </section>
  )
}

export default ExerciseLibrary
