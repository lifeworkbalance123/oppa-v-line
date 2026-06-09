import { useEffect, useMemo, useState } from 'react'
import { getEffectiveYoutubeUrl } from '../lib/exerciseSettings'
import VideoWithFallback from './VideoWithFallback'
import './ExerciseLibrary.css'

const STORAGE_KEY = 'oppa-v-line-library-progress'

const EXERCISES = [
  {
    id: 'isometric-chin-tuck',
    name: 'Isometric Chin Tuck',
    sets: 3,
    metric: '10s hold',
    type: 'hold',
    youtubeUrl: 'https://www.youtube.com/watch?v=example-chin-tuck',
    steps: [
      'Sit or stand with your spine tall and shoulders relaxed.',
      'Gently draw your chin straight back without tilting your head down.',
      'Hold for 10 seconds while keeping your neck long.',
      'Release slowly and repeat for all sets.',
    ],
  },
  {
    id: 'jawline-definer',
    name: 'Jawline Definer',
    sets: 3,
    metric: '15 reps',
    type: 'reps',
    youtubeUrl: 'https://www.youtube.com/watch?v=example-jawline-definer',
    steps: [
      'Relax your jaw and align your head over your shoulders.',
      'Slide your lower jaw slightly forward, then return to neutral.',
      'Complete 15 controlled reps per set.',
      'Avoid clenching your teeth throughout the movement.',
    ],
  },
  {
    id: 'cheek-lifter',
    name: 'Cheek Lifter',
    sets: 3,
    metric: '12 reps',
    type: 'reps',
    youtubeUrl: 'https://www.youtube.com/watch?v=example-cheek-lifter',
    steps: [
      'Smile gently while keeping your lips closed.',
      'Lift your cheeks upward toward your eyes without squinting.',
      'Hold briefly at the top, then release with control.',
      'Repeat for 12 reps each set.',
    ],
  },
  {
    id: 'full-face-lift',
    name: 'Full Face Lift',
    sets: 3,
    metric: '10s hold',
    type: 'hold',
    youtubeUrl: 'https://www.youtube.com/watch?v=example-full-face-lift',
    steps: [
      'Place fingertips lightly at your temples and jawline.',
      'Engage facial muscles upward as if resisting gravity.',
      'Hold the lift for 10 seconds with steady breathing.',
      'Release and reset before the next set.',
    ],
  },
  {
    id: 'tongue-posture',
    name: 'Tongue Posture',
    sets: 3,
    metric: '10s hold',
    type: 'hold',
    youtubeUrl: 'https://www.youtube.com/watch?v=example-tongue-posture',
    steps: [
      'Rest the tip of your tongue on the ridge behind your upper teeth.',
      'Press the back of your tongue flat against the roof of your mouth.',
      'Hold for 10 seconds while breathing through your nose.',
      'Maintain relaxed lips and jaw during each hold.',
    ],
  },
]

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

function ExerciseCard({ exercise, completedSets, mode, onModeChange, onToggleSet }) {
  const completedCount = completedSets.filter(Boolean).length
  const isComplete = completedCount === exercise.sets

  return (
    <article
      className={`exercise-library__card${isComplete ? ' exercise-library__card--done' : ''}`}
    >
      <header className="exercise-library__card-header">
        <div>
          <h3 className="exercise-library__name">{exercise.name}</h3>
          <p className="exercise-library__meta">
            {exercise.sets} sets · {exercise.metric}
          </p>
        </div>
        <span className="exercise-library__progress-badge">
          {completedCount}/{exercise.sets}
        </span>
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
        <VideoWithFallback
          exerciseName={exercise.name}
          youtubeUrl={getEffectiveYoutubeUrl(exercise.id, exercise.youtubeUrl)}
          steps={exercise.steps}
        />
      ) : (
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
      )}
    </article>
  )
}

function ExerciseLibrary() {
  const [progress, setProgress] = useState(loadProgress)
  const [modes, setModes] = useState(
    () => EXERCISES.reduce((acc, exercise) => {
      acc[exercise.id] = 'demo'
      return acc
    }, {}),
  )

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

  return (
    <section className="exercise-library">
      <header className="exercise-library__header">
        <h1 className="exercise-library__title">Exercise Library</h1>
        <p className="exercise-library__summary">
          {overallProgress.completedSets}/{overallProgress.totalSets} sets completed
        </p>
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
          />
        ))}
      </div>
    </section>
  )
}

export default ExerciseLibrary
