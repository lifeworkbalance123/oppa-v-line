export const ROUTINE_EXERCISES = {
  'posture-reset': {
    id: 'posture-reset',
    name: 'Posture Reset',
    duration: '1 min',
    isPremium: false,
    videoUrl: 'https://www.youtube.com/watch?v=example-posture-reset',
  },
  'vertical-lift': {
    id: 'vertical-lift',
    name: 'Vertical Lift',
    duration: '1 min',
    isPremium: false,
    videoUrl: 'https://www.youtube.com/watch?v=example-vertical-lift',
  },
  'midline-v-press': {
    id: 'midline-v-press',
    name: 'Midline V-Press',
    duration: '2 min',
    isPremium: true,
    videoUrl: 'https://www.youtube.com/watch?v=example-midline-v-press',
  },
}

export function getExercisesForCommitment(commitment) {
  return commitment.exerciseIds
    .map((id) => ROUTINE_EXERCISES[id])
    .filter(Boolean)
}
