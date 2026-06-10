import { useEffect, useMemo, useState } from 'react'
import {
  EXERCISE_SETTINGS_KEY,
  EXERCISE_SETTINGS_UPDATED_EVENT,
  resolveExerciseMedia,
} from '../lib/exerciseSettings'
import { getRecommendedSeconds } from '../lib/exercises'
import ExerciseTimer from './ExerciseTimer'
import VideoWithFallback from './VideoWithFallback'
import './ExerciseDemoPanel.css'

function ExerciseDemoPanel({ exercise, onClose }) {
  const [settingsTick, setSettingsTick] = useState(0)

  useEffect(() => {
    const refresh = () => setSettingsTick((tick) => tick + 1)
    window.addEventListener(EXERCISE_SETTINGS_UPDATED_EVENT, refresh)
    window.addEventListener('focus', refresh)

    const handleStorage = (event) => {
      if (event.key === EXERCISE_SETTINGS_KEY) {
        refresh()
      }
    }
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener(EXERCISE_SETTINGS_UPDATED_EVENT, refresh)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  const media = useMemo(
    () => resolveExerciseMedia(exercise),
    [exercise, settingsTick],
  )

  const recommendedSeconds = getRecommendedSeconds(exercise)

  if (!exercise) return null

  return (
    <div className="exercise-demo-panel">
      <div className="exercise-demo-panel__header">
        <h4 className="exercise-demo-panel__title">{exercise.name}</h4>
        <button
          type="button"
          className="exercise-demo-panel__close"
          onClick={onClose}
          aria-label={`Close ${exercise.name} demo`}
        >
          ×
        </button>
      </div>

      <ExerciseTimer recommendedSeconds={recommendedSeconds} />

      <VideoWithFallback
        exerciseName={exercise.name}
        youtubeUrl={media.youtubeUrl}
        mp4Url={media.mp4Url}
        anatomyImageUrl={media.anatomyImageUrl}
        steps={exercise.steps ?? []}
      />
    </div>
  )
}

export default ExerciseDemoPanel
