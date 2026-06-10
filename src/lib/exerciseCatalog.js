import { HOME_EXERCISES, LIBRARY_EXERCISES, getExerciseFallbackYoutube } from './exercises'

export const ADMIN_EXERCISES = [...HOME_EXERCISES, ...LIBRARY_EXERCISES].map((exercise) => ({
  id: exercise.id,
  name: exercise.name,
  defaultYoutubeUrl: getExerciseFallbackYoutube(exercise),
}))
