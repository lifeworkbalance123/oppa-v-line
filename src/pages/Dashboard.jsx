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
import DailyCommitmentSelector from '../components/DailyCommitmentSelector'
import ExerciseDemoPanel from '../components/ExerciseDemoPanel'
import {
  FREE_HOME_EXERCISES,
  formatRecommendedTime,
  getRecommendedSeconds,
  HOME_EXERCISES,
  PREMIUM_HOME_EXERCISES,
} from '../lib/exercises'
import { tryRecordCoreCompletionFromExercises } from '../lib/streakTracking'
import './Dashboard.css'

const STORAGE_KEYS = {
  completed: 'oppa-v-line-completed-exercises',
  trackers: 'oppa-v-line-trackers',
  pendingUpgrade: 'oppa-v-line-pending-upgrade',
  puffiness: 'oppa-v-line-puffiness',
}

const PUFFINESS_LABELS = {
  1: 'Very puffy',
  2: 'Puffy',
  3: 'Moderate',
  4: 'Slight',
  5: 'Clear',
}

const FREE_EXERCISES = FREE_HOME_EXERCISES
const LOCKED_EXERCISES = PREMIUM_HOME_EXERCISES
const ALL_EXERCISES = HOME_EXERCISES
const SODIUM_LEVELS = ['Low', 'Medium', 'High']
const GLASS_ML = 250
const WATER_GOAL_GLASSES = 8
const METERS_PER_STEP = 0.75

const SODIUM_GUIDANCE = {
  Low: 'Mostly fresh or home-cooked meals with little added salt (<1,500 mg/day).',
  Medium: 'Typical mixed diet with moderate seasoning (~1,500–2,300 mg/day).',
  High: 'Salty snacks, ramen, or delivery meals (>2,300 mg/day) — often causes puffiness.',
}

function formatWaterVolume(glasses) {
  const ml = glasses * GLASS_ML
  if (ml >= 1000) {
    const liters = ml / 1000
    return liters % 1 === 0 ? `${liters} L` : `${liters.toFixed(1)} L`
  }
  return `${ml.toLocaleString()} ml`
}

function formatStepsDistance(steps) {
  const meters = steps * METERS_PER_STEP
  if (meters < 1000) {
    return `${Math.round(meters).toLocaleString()} m`
  }
  return `${(meters / 1000).toFixed(1)} km`
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

function getTimeGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function getDisplayName(user) {
  if (!user) return 'there'
  const metadata = user.user_metadata ?? {}
  return (
    metadata.full_name
    || metadata.name
    || user.email?.split('@')[0]
    || 'there'
  )
}

function loadPuffinessRating() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.puffiness)
    if (!stored) return 3
    const parsed = JSON.parse(stored)
    const today = getTodayKey()
    const rating = Number(parsed?.[today])
    if (rating >= 1 && rating <= 5) return rating
    return 3
  } catch {
    return 3
  }
}

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
  isVideoOpen,
  onToggleComplete,
  onWatchVideo,
  onCloseVideo,
}) {
  const recommendedLabel = formatRecommendedTime(getRecommendedSeconds(exercise))

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
        <p className="dashboard-exercise__duration">
          {exercise.duration} · Timer: {recommendedLabel}
        </p>
      </div>
      <div className="dashboard-exercise__actions">
        <button
          type="button"
          className={`dashboard-btn dashboard-btn--secondary${isVideoOpen ? ' dashboard-btn--active' : ''}`}
          onClick={() => onWatchVideo(exercise)}
          disabled={isLocked}
        >
          {isVideoOpen ? 'Hide Video' : 'Video'}
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

      {isVideoOpen && !isLocked && (
        <ExerciseDemoPanel exercise={exercise} onClose={onCloseVideo} />
      )}
    </article>
  )
}

function Dashboard() {
  const { user } = useAuth()
  const [completedExercises, setCompletedExercises] = useState(loadCompletedExercises)
  const [trackers, setTrackers] = useState(loadTrackers)
  const [puffinessRating, setPuffinessRating] = useState(loadPuffinessRating)
  const [isPremium, setIsPremium] = useState(false)
  const [upgradeLoading, setUpgradeLoading] = useState(false)
  const [upgradeError, setUpgradeError] = useState(null)
  const [dismissedSodiumAlert, setDismissedSodiumAlert] = useState(false)
  const [activeVideoId, setActiveVideoId] = useState(null)

  const greeting = getTimeGreeting()
  const displayName = getDisplayName(user)
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
    if (window.location.hash === '#daily-trackers') {
      document.getElementById('daily-trackers')?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.completed,
      JSON.stringify(completedExercises),
    )
    tryRecordCoreCompletionFromExercises(completedExercises)
  }, [completedExercises])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.trackers, JSON.stringify(trackers))
  }, [trackers])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.puffiness)
      const parsed = stored ? JSON.parse(stored) : {}
      parsed[getTodayKey()] = puffinessRating
      localStorage.setItem(STORAGE_KEYS.puffiness, JSON.stringify(parsed))
    } catch {
      // Ignore storage errors.
    }
  }, [puffinessRating])

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
    setActiveVideoId((prev) => (prev === exercise.id ? null : exercise.id))
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
      <header className="dashboard-greeting">
        <h1 className="dashboard-greeting__title">
          {greeting}, {displayName}
        </h1>
        <p className="dashboard-greeting__progress">
          {totalCompletedCount}/{ALL_EXERCISES.length} completed today
        </p>
      </header>

      <section className="dashboard-card dashboard-puffiness">
        <div className="dashboard-card__header">
          <h2 className="dashboard-card__title">Morning Puffiness</h2>
          <span className="dashboard-puffiness__value">
            {PUFFINESS_LABELS[puffinessRating]}
          </span>
        </div>
        <input
          type="range"
          className="dashboard-puffiness__slider"
          min="1"
          max="5"
          step="1"
          value={puffinessRating}
          onChange={(event) => setPuffinessRating(Number(event.target.value))}
          aria-label="Morning puffiness rating from 1 very puffy to 5 clear"
          aria-valuemin={1}
          aria-valuemax={5}
          aria-valuenow={puffinessRating}
          aria-valuetext={PUFFINESS_LABELS[puffinessRating]}
        />
        <div className="dashboard-puffiness__labels">
          <span>1 · Very puffy</span>
          <span>5 · Clear</span>
        </div>
      </section>

      <DailyCommitmentSelector />

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
              isVideoOpen={activeVideoId === exercise.id}
              onToggleComplete={toggleComplete}
              onWatchVideo={watchVideo}
              onCloseVideo={() => setActiveVideoId(null)}
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
              isVideoOpen={activeVideoId === exercise.id}
              onToggleComplete={toggleComplete}
              onWatchVideo={watchVideo}
              onCloseVideo={() => setActiveVideoId(null)}
            />
          ))}
        </div>
      </section>

      <section className="dashboard-section" id="daily-trackers">
        <h2 className="dashboard-section__title">Daily Trackers</h2>
        <div className="dashboard-trackers">
          <div className="dashboard-tracker-card">
            <div className="dashboard-tracker-card__header">
              <h3>Water</h3>
              <span>
                {trackers.water}/{WATER_GOAL_GLASSES} glasses · {formatWaterVolume(trackers.water)}
              </span>
            </div>
            <p className="dashboard-tracker-card__hint">
              1 glass = {GLASS_ML} ml · Daily goal: {formatWaterVolume(WATER_GOAL_GLASSES)} ({WATER_GOAL_GLASSES} glasses)
            </p>
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
            <p className="dashboard-tracker-card__hint">
              {SODIUM_GUIDANCE[trackers.sodium]}
            </p>
          </div>

          <div className="dashboard-tracker-card">
            <div className="dashboard-tracker-card__header">
              <h3>Steps</h3>
              {trackers.steps > 0 && (
                <span>≈ {formatStepsDistance(trackers.steps)}</span>
              )}
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
            <p className="dashboard-tracker-card__hint">
              {trackers.steps > 0
                ? `${trackers.steps.toLocaleString()} steps ≈ ${formatStepsDistance(trackers.steps)} walked (avg ${METERS_PER_STEP * 100} cm stride)`
                : `1,000 steps ≈ ${formatStepsDistance(1000)} · 3,000 steps ≈ ${formatStepsDistance(3000)}`}
            </p>
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
