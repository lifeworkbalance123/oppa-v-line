import { HOME_EXERCISES } from './exercises'

export const ROUTINE_EXERCISES = Object.fromEntries(
  HOME_EXERCISES.map((exercise) => [
    exercise.id,
    {
      id: exercise.id,
      name: exercise.name,
      duration: exercise.duration,
      isPremium: exercise.isPremium,
      videoUrl: exercise.videoUrl,
      linkedMediaIds: exercise.linkedMediaIds,
      steps: exercise.steps,
      recommendedSeconds: exercise.recommendedSeconds,
    },
  ]),
)

export function getExercisesForCommitment(commitment) {
  return commitment.exerciseIds
    .map((id) => ROUTINE_EXERCISES[id])
    .filter(Boolean)
}
