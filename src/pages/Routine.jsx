import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../App'
import { checkPremiumAccess } from '../lib/supabase'
import {
  getCommitmentById,
  loadSelectedCommitment,
} from '../lib/dailyCommitment'
import ExerciseDemoPanel from '../components/ExerciseDemoPanel'
import { formatRecommendedTime, getRecommendedSeconds } from '../lib/exercises'
import { getExercisesForCommitment } from '../lib/routineExercises'
import {
  loadStreakState,
  MAINTENANCE_EXERCISE_IDS,
  recordMaintenanceSession,
  tryRecordCoreCompletionFromExercises,
} from '../lib/streakTracking'
import './Routine.css'

const COMPLETED_STORAGE_KEY = 'oppa-v-line-completed-exercises'
const SKINCARE_STORAGE_KEY = 'oppa-v-line-routine-jojoba'

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

function loadCompletedExercises() {
  try {
    const stored = localStorage.getItem(COMPLETED_STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function loadJojobaComplete() {
  try {
    const stored = localStorage.getItem(SKINCARE_STORAGE_KEY)
    if (!stored) return false
    const parsed = JSON.parse(stored)
    return Boolean(parsed[getTodayKey()])
  } catch {
    return false
  }
}

function RoutineExerciseCard({
  exercise,
  isLocked,
  isCompleted,
  isVideoOpen,
  onToggleComplete,
  onWatchVideo,
  onCloseVideo,
}) {
  const recommendedLabel = formatRecommendedTime(getRecommendedSeconds(exercise))

  return (
    <article
      className={`routine-exercise${isLocked ? ' routine-exercise--locked' : ''}${isCompleted ? ' routine-exercise--completed' : ''}`}
    >
      <div className="routine-exercise__info">
        <div className="routine-exercise__title-row">
          <h3 className="routine-exercise__name">{exercise.name}</h3>
          {isLocked && <span className="routine-exercise__badge">Locked</span>}
          {isCompleted && (
            <span className="routine-exercise__badge routine-exercise__badge--done">Done</span>
          )}
        </div>
        <p className="routine-exercise__duration">
          {exercise.duration} · Timer: {recommendedLabel}
        </p>
      </div>
      <div className="routine-exercise__actions">
        <button
          type="button"
          className="routine-btn routine-btn--secondary"
          onClick={() => onWatchVideo(exercise)}
          disabled={isLocked}
        >
          {isVideoOpen ? 'Hide Video' : 'Video'}
        </button>
        <button
          type="button"
          className="routine-btn routine-btn--primary"
          onClick={() => onToggleComplete(exercise.id)}
          disabled={isLocked}
        >
          {isCompleted ? 'Undo' : 'Complete'}
        </button>
      </div>

      {isVideoOpen && !isLocked && (
        <ExerciseDemoPanel exercise={exercise} onClose={onCloseVideo} />
      )}
    </article>
  )
}

function Routine() {
  const { user } = useAuth()
  const commitment = useMemo(
    () => getCommitmentById(loadSelectedCommitment()),
    [],
  )
  const exercises = useMemo(
    () => getExercisesForCommitment(commitment),
    [commitment],
  )

  const [completedExercises, setCompletedExercises] = useState(loadCompletedExercises)
  const [jojobaComplete, setJojobaComplete] = useState(loadJojobaComplete)
  const [isPremium, setIsPremium] = useState(false)
  const [activeVideoId, setActiveVideoId] = useState(null)

  const completedSet = useMemo(
    () => new Set(completedExercises),
    [completedExercises],
  )

  const routineCompletedCount = exercises.filter(
    (exercise) => completedSet.has(exercise.id),
  ).length

  useEffect(() => {
    localStorage.setItem(COMPLETED_STORAGE_KEY, JSON.stringify(completedExercises))
    const { programMode } = loadStreakState()
    const maintenanceComplete = MAINTENANCE_EXERCISE_IDS.every(
      (id) => completedExercises.includes(id),
    )

    if (programMode === 'maintenance' && maintenanceComplete) {
      recordMaintenanceSession()
    } else {
      tryRecordCoreCompletionFromExercises(completedExercises)
    }
  }, [completedExercises])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SKINCARE_STORAGE_KEY)
      const parsed = stored ? JSON.parse(stored) : {}
      parsed[getTodayKey()] = jojobaComplete
      localStorage.setItem(SKINCARE_STORAGE_KEY, JSON.stringify(parsed))
    } catch {
      // Ignore storage errors.
    }
  }, [jojobaComplete])

  useEffect(() => {
    if (!user) {
      setIsPremium(false)
      return undefined
    }

    let cancelled = false

    checkPremiumAccess(user.id).then(({ isPremium: premium }) => {
      if (!cancelled) {
        setIsPremium(premium)
      }
    })

    return () => {
      cancelled = true
    }
  }, [user])

  const toggleComplete = (exerciseId) => {
    setCompletedExercises((prev) =>
      prev.includes(exerciseId)
        ? prev.filter((id) => id !== exerciseId)
        : [...prev, exerciseId],
    )
  }

  const watchVideo = (exercise) => {
    setActiveVideoId((prev) => (prev === exercise.id ? null : exercise.id))
  }

  return (
    <section className="routine-page">
      <header className="routine-page__header">
        <Link to="/home" className="routine-page__back">
          ← Back to Home
        </Link>
        <h1 className="routine-page__title">
          {commitment.icon} {commitment.title} Routine
        </h1>
        <p className="routine-page__meta">
          {commitment.time} · {routineCompletedCount}/{exercises.length} exercises done
        </p>
      </header>

      <div className="routine-page__list">
        {exercises.map((exercise) => (
          <RoutineExerciseCard
            key={exercise.id}
            exercise={exercise}
            isLocked={exercise.isPremium && !isPremium}
            isCompleted={completedSet.has(exercise.id)}
            isVideoOpen={activeVideoId === exercise.id}
            onToggleComplete={toggleComplete}
            onWatchVideo={watchVideo}
            onCloseVideo={() => setActiveVideoId(null)}
          />
        ))}
      </div>

      {commitment.showSkincare && (
        <section className="routine-page__extra">
          <h2 className="routine-page__extra-title">Skincare</h2>
          <button
            type="button"
            className={`routine-skincare${jojobaComplete ? ' routine-skincare--done' : ''}`}
            onClick={() => setJojobaComplete((prev) => !prev)}
            aria-pressed={jojobaComplete}
          >
            <span className="routine-skincare__check" aria-hidden="true">
              {jojobaComplete ? '✓' : ''}
            </span>
            <span>
              <strong>Jojoba oil application</strong>
              <span className="routine-skincare__hint">
                Apply a few drops after your routine to lock in moisture.
              </span>
            </span>
          </button>
        </section>
      )}

      {commitment.showTrackers && (
        <section className="routine-page__extra">
          <h2 className="routine-page__extra-title">Daily Trackers</h2>
          <p className="routine-page__extra-text">
            Log water, sodium, and steps to complete your commitment.
          </p>
          <Link to="/home#daily-trackers" className="routine-btn routine-btn--accent routine-btn--full">
            Log Trackers on Home
          </Link>
        </section>
      )}
    </section>
  )
}

export default Routine
