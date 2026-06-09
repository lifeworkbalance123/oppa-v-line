import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../App'
import {
  checkPremiumAccess,
  signInWithGoogle,
} from '../lib/supabase'
import {
  createCheckoutSession,
  redirectToCheckout,
} from '../lib/stripe'
import './Dashboard.css'

const STORAGE_KEYS = {
  completed: 'oppa-v-line-completed-exercises',
  trackers: 'oppa-v-line-trackers',
  pendingUpgrade: 'oppa-v-line-pending-upgrade',
}

const FREE_EXERCISES = [
  {
    id: 'posture-reset',
    name: 'Posture Reset',
    duration: '5 min',
    videoUrl: 'https://www.youtube.com/watch?v=example-posture-reset',
  },
  {
    id: 'vertical-lift',
    name: 'Vertical Lift',
    duration: '8 min',
    videoUrl: 'https://www.youtube.com/watch?v=example-vertical-lift',
  },
]

const LOCKED_EXERCISES = [
  {
    id: 'midline-v-press',
    name: 'Midline V-Press',
    duration: '10 min',
    videoUrl: 'https://www.youtube.com/watch?v=example-midline-v-press',
  },
  {
    id: 'lymphatic-drain',
    name: 'Lymphatic Drain',
    duration: '12 min',
    videoUrl: 'https://www.youtube.com/watch?v=example-lymphatic-drain',
  },
  {
    id: 'passive-tongue-posture',
    name: 'Passive Tongue Posture',
    duration: '7 min',
    videoUrl: 'https://www.youtube.com/watch?v=example-tongue-posture',
  },
]

const ALL_EXERCISES = [...FREE_EXERCISES, ...LOCKED_EXERCISES]
const SODIUM_LEVELS = ['Low', 'Medium', 'High']

const DEFAULT_TRACKERS = {
  water: 0,
  sodium: 'Low',
  steps: 0,
}

function loadCompletedExercises() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.completed)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function loadTrackers() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.trackers)
    if (!stored) return DEFAULT_TRACKERS
    const parsed = JSON.parse(stored)
    return {
      water: Math.min(8, Math.max(0, Number(parsed.water) || 0)),
      sodium: SODIUM_LEVELS.includes(parsed.sodium) ? parsed.sodium : 'Low',
      steps: Math.max(0, Number(parsed.steps) || 0),
    }
  } catch {
    return DEFAULT_TRACKERS
  }
}

function ExerciseCard({
  exercise,
  isLocked,
  isCompleted,
  onToggleComplete,
  onWatchVideo,
}) {
  return (
    <article
      className={`dashboard-exercise${isLocked ? ' dashboard-exercise--locked' : ''}${isCompleted ? ' dashboard-exercise--completed' : ''}`}
    >
      <div className="dashboard-exercise__info">
        <div className="dashboard-exercise__title-row">
          <h3 className="dashboard-exercise__name">{exercise.name}</h3>
          {isLocked && <span className="dashboard-exercise__badge">Locked</span>}
          {isCompleted && <span className="dashboard-exercise__badge dashboard-exercise__badge--done">Done</span>}
        </div>
        <p className="dashboard-exercise__duration">{exercise.duration}</p>
      </div>
      <div className="dashboard-exercise__actions">
        <button
          type="button"
          className="dashboard-btn dashboard-btn--secondary"
          onClick={() => onWatchVideo(exercise)}
          disabled={isLocked}
        >
          Video
        </button>
        <button
          type="button"
          className="dashboard-btn dashboard-btn--primary"
          onClick={() => onToggleComplete(exercise.id)}
          disabled={isLocked}
        >
          {isCompleted ? 'Undo' : 'Complete'}
        </button>
      </div>
    </article>
  )
}

function Dashboard() {
  const { user } = useAuth()
  const [completedExercises, setCompletedExercises] = useState(loadCompletedExercises)
  const [trackers, setTrackers] = useState(loadTrackers)
  const [isPremium, setIsPremium] = useState(false)
  const [upgradeLoading, setUpgradeLoading] = useState(false)
  const [upgradeError, setUpgradeError] = useState(null)
  const [dismissedSodiumAlert, setDismissedSodiumAlert] = useState(false)

  const completedSet = useMemo(
    () => new Set(completedExercises),
    [completedExercises],
  )

  const freeCompletedCount = useMemo(
    () => FREE_EXERCISES.filter((exercise) => completedSet.has(exercise.id)).length,
    [completedSet],
  )

  const totalCompletedCount = useMemo(
    () => ALL_EXERCISES.filter((exercise) => completedSet.has(exercise.id)).length,
    [completedSet],
  )

  const showUpgradeBanner = freeCompletedCount >= 2 && !isPremium
  const showSodiumAlert = trackers.sodium === 'High' && !dismissedSodiumAlert

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.completed,
      JSON.stringify(completedExercises),
    )
  }, [completedExercises])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.trackers, JSON.stringify(trackers))
  }, [trackers])

  useEffect(() => {
    setDismissedSodiumAlert(false)
  }, [trackers.sodium])

  useEffect(() => {
    if (!user) {
      setIsPremium(false)
      return
    }

    let cancelled = false

    checkPremiumAccess(user.id).then(({ isPremium: premium, error }) => {
      if (!cancelled) {
        setIsPremium(premium)
        if (error) {
          console.error(error.message)
        }
      }
    })

    return () => {
      cancelled = true
    }
  }, [user])

  const startStripeCheckout = useCallback(async () => {
    setUpgradeLoading(true)
    setUpgradeError(null)

    const { sessionId, error } = await createCheckoutSession({
      userId: user?.id,
      email: user?.email,
    })

    if (error) {
      setUpgradeError(error.message)
      setUpgradeLoading(false)
      return
    }

    const { error: redirectError } = await redirectToCheckout(sessionId)
    if (redirectError) {
      setUpgradeError(redirectError.message)
    }

    setUpgradeLoading(false)
  }, [user])

  useEffect(() => {
    const pendingUpgrade = localStorage.getItem(STORAGE_KEYS.pendingUpgrade)
    if (!pendingUpgrade || !user) return

    localStorage.removeItem(STORAGE_KEYS.pendingUpgrade)
    startStripeCheckout()
  }, [user, startStripeCheckout])

  const handleUpgrade = async () => {
    setUpgradeError(null)

    if (!user) {
      setUpgradeLoading(true)
      localStorage.setItem(STORAGE_KEYS.pendingUpgrade, 'true')

      const { error } = await signInWithGoogle()
      if (error) {
        localStorage.removeItem(STORAGE_KEYS.pendingUpgrade)
        setUpgradeError(error.message)
      }

      setUpgradeLoading(false)
      return
    }

    await startStripeCheckout()
  }

  const toggleComplete = (exerciseId) => {
    setCompletedExercises((prev) =>
      prev.includes(exerciseId)
        ? prev.filter((id) => id !== exerciseId)
        : [...prev, exerciseId],
    )
  }

  const watchVideo = (exercise) => {
    window.open(exercise.videoUrl, '_blank', 'noopener,noreferrer')
  }

  const updateWater = (delta) => {
    setTrackers((prev) => ({
      ...prev,
      water: Math.min(8, Math.max(0, prev.water + delta)),
    }))
  }

  const updateSodium = (level) => {
    setTrackers((prev) => ({ ...prev, sodium: level }))
  }

  const updateSteps = (value) => {
    const steps = Math.max(0, Number.parseInt(value, 10) || 0)
    setTrackers((prev) => ({ ...prev, steps }))
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-header__label">Daily Program</p>
          <h1 className="dashboard-header__title">OPPA V-LINE</h1>
        </div>
        <div className="dashboard-header__progress">
          <span className="dashboard-header__progress-count">
            {totalCompletedCount}/{ALL_EXERCISES.length}
          </span>
          <span className="dashboard-header__progress-label">completed</span>
        </div>
      </header>

      {showSodiumAlert && (
        <div className="dashboard-alert dashboard-alert--warning" role="alert">
          <p>
            <strong>High sodium detected.</strong> Try the Lymphatic Drain exercise
            to help reduce facial puffiness and support fluid balance.
          </p>
          <button
            type="button"
            className="dashboard-alert__dismiss"
            onClick={() => setDismissedSodiumAlert(true)}
            aria-label="Dismiss alert"
          >
            ×
          </button>
        </div>
      )}

      {showUpgradeBanner && (
        <div className="dashboard-banner">
          <div>
            <p className="dashboard-banner__title">Ready for the full program?</p>
            <p className="dashboard-banner__text">
              You finished both free exercises. Upgrade to unlock premium routines.
            </p>
          </div>
          <button
            type="button"
            className="dashboard-btn dashboard-btn--accent dashboard-btn--full"
            onClick={handleUpgrade}
            disabled={upgradeLoading}
          >
            {upgradeLoading ? 'Loading...' : 'Upgrade Now'}
          </button>
        </div>
      )}

      {upgradeError && (
        <div className="dashboard-alert dashboard-alert--danger" role="alert">
          <p>{upgradeError}</p>
        </div>
      )}

      <section className="dashboard-section">
        <h2 className="dashboard-section__title">Free Exercises</h2>
        <div className="dashboard-exercise-list">
          {FREE_EXERCISES.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              isLocked={false}
              isCompleted={completedSet.has(exercise.id)}
              onToggleComplete={toggleComplete}
              onWatchVideo={watchVideo}
            />
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <h2 className="dashboard-section__title">Premium Exercises</h2>
        <div className="dashboard-exercise-list">
          {LOCKED_EXERCISES.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              isLocked={!isPremium}
              isCompleted={completedSet.has(exercise.id)}
              onToggleComplete={toggleComplete}
              onWatchVideo={watchVideo}
            />
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <h2 className="dashboard-section__title">Daily Trackers</h2>
        <div className="dashboard-trackers">
          <div className="dashboard-tracker-card">
            <div className="dashboard-tracker-card__header">
              <h3>Water</h3>
              <span>{trackers.water}/8 glasses</span>
            </div>
            <div className="dashboard-tracker-card__controls">
              <button
                type="button"
                className="dashboard-btn dashboard-btn--round"
                onClick={() => updateWater(-1)}
                disabled={trackers.water === 0}
                aria-label="Remove one glass of water"
              >
                −
              </button>
              <div className="dashboard-water-dots" aria-hidden="true">
                {Array.from({ length: 8 }, (_, index) => (
                  <span
                    key={index}
                    className={`dashboard-water-dot${index < trackers.water ? ' dashboard-water-dot--filled' : ''}`}
                  />
                ))}
              </div>
              <button
                type="button"
                className="dashboard-btn dashboard-btn--round"
                onClick={() => updateWater(1)}
                disabled={trackers.water === 8}
                aria-label="Add one glass of water"
              >
                +
              </button>
            </div>
          </div>

          <div className="dashboard-tracker-card">
            <div className="dashboard-tracker-card__header">
              <h3>Sodium</h3>
              <span>{trackers.sodium}</span>
            </div>
            <div className="dashboard-segmented">
              {SODIUM_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  className={`dashboard-segmented__btn${trackers.sodium === level ? ' dashboard-segmented__btn--active' : ''}${level === 'High' ? ' dashboard-segmented__btn--high' : ''}`}
                  onClick={() => updateSodium(level)}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="dashboard-tracker-card">
            <div className="dashboard-tracker-card__header">
              <h3>Steps</h3>
            </div>
            <input
              type="number"
              className="dashboard-input"
              min="0"
              step="100"
              value={trackers.steps}
              onChange={(event) => updateSteps(event.target.value)}
              inputMode="numeric"
              placeholder="0"
              aria-label="Daily steps"
            />
          </div>
        </div>
      </section>

      <footer className="dashboard-footer">
        <button
          type="button"
          className="dashboard-btn dashboard-btn--accent dashboard-btn--full"
          onClick={handleUpgrade}
          disabled={upgradeLoading || isPremium}
        >
          {isPremium
            ? 'Premium Active'
            : upgradeLoading
              ? 'Loading...'
              : 'Upgrade to Premium'}
        </button>
      </footer>
    </div>
  )
}

export default Dashboard
