export const HOME_EXERCISES = [
  {
    id: 'posture-reset',
    name: 'Posture Reset',
    duration: '5 min',
    recommendedSeconds: 300,
    videoUrl: 'https://www.youtube.com/watch?v=example-posture-reset',
    linkedMediaIds: ['isometric-chin-tuck'],
    steps: [
      'Sit or stand with your spine tall and shoulders relaxed.',
      'Gently draw your chin straight back without tilting your head down.',
      'Hold for 10 seconds while keeping your neck long.',
      'Release slowly and repeat for all sets.',
    ],
    isPremium: false,
  },
  {
    id: 'vertical-lift',
    name: 'Vertical Lift',
    duration: '8 min',
    recommendedSeconds: 480,
    videoUrl: 'https://www.youtube.com/watch?v=example-vertical-lift',
    linkedMediaIds: ['cheek-lifter'],
    steps: [
      'Smile gently while keeping your lips closed.',
      'Lift your cheeks upward toward your eyes without squinting.',
      'Hold briefly at the top, then release with control.',
      'Repeat for 12 reps each set.',
    ],
    isPremium: false,
  },
  {
    id: 'midline-v-press',
    name: 'Midline V-Press',
    duration: '10 min',
    recommendedSeconds: 600,
    videoUrl: 'https://www.youtube.com/watch?v=example-midline-v-press',
    linkedMediaIds: ['jawline-definer'],
    steps: [
      'Relax your jaw and align your head over your shoulders.',
      'Slide your lower jaw slightly forward, then return to neutral.',
      'Complete 15 controlled reps per set.',
      'Avoid clenching your teeth throughout the movement.',
    ],
    isPremium: true,
  },
  {
    id: 'lymphatic-drain',
    name: 'Lymphatic Drain',
    duration: '12 min',
    recommendedSeconds: 720,
    videoUrl: 'https://www.youtube.com/watch?v=example-lymphatic-drain',
    linkedMediaIds: ['full-face-lift'],
    steps: [
      'Place fingertips lightly at your temples and jawline.',
      'Use gentle sweeping strokes toward your ears and collarbone.',
      'Breathe slowly and avoid pressing too hard.',
      'Repeat for the full recommended session time.',
    ],
    isPremium: true,
  },
  {
    id: 'passive-tongue-posture',
    name: 'Passive Tongue Posture',
    duration: '7 min',
    recommendedSeconds: 420,
    videoUrl: 'https://www.youtube.com/watch?v=example-tongue-posture',
    linkedMediaIds: ['tongue-posture'],
    steps: [
      'Rest the tip of your tongue on the ridge behind your upper teeth.',
      'Press the back of your tongue flat against the roof of your mouth.',
      'Hold for 10 seconds while breathing through your nose.',
      'Maintain relaxed lips and jaw during each hold.',
    ],
    isPremium: true,
  },
]

export const LIBRARY_EXERCISES = [
  {
    id: 'isometric-chin-tuck',
    name: 'Isometric Chin Tuck',
    sets: 3,
    metric: '10s hold',
    type: 'hold',
    recommendedSeconds: 90,
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
    recommendedSeconds: 135,
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
    recommendedSeconds: 120,
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
    recommendedSeconds: 90,
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
    recommendedSeconds: 90,
    youtubeUrl: 'https://www.youtube.com/watch?v=example-tongue-posture',
    steps: [
      'Rest the tip of your tongue on the ridge behind your upper teeth.',
      'Press the back of your tongue flat against the roof of your mouth.',
      'Hold for 10 seconds while breathing through your nose.',
      'Maintain relaxed lips and jaw during each hold.',
    ],
  },
]

export const FREE_HOME_EXERCISES = HOME_EXERCISES.filter((exercise) => !exercise.isPremium)
export const PREMIUM_HOME_EXERCISES = HOME_EXERCISES.filter((exercise) => exercise.isPremium)

const EXERCISE_MAP = new Map(
  [...HOME_EXERCISES, ...LIBRARY_EXERCISES].map((exercise) => [exercise.id, exercise]),
)

export function getExerciseById(exerciseId) {
  return EXERCISE_MAP.get(exerciseId) ?? null
}

export function formatRecommendedTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes === 0) return `${seconds}s`
  if (seconds === 0) return `${minutes} min`
  return `${minutes} min ${seconds}s`
}

export function getRecommendedSeconds(exercise) {
  if (!exercise) return 60
  if (exercise.recommendedSeconds) return exercise.recommendedSeconds
  const minuteMatch = exercise.duration?.match(/(\d+)\s*min/i)
  if (minuteMatch) return Number(minuteMatch[1]) * 60
  return 60
}

export function getExerciseFallbackYoutube(exercise) {
  return exercise?.videoUrl ?? exercise?.youtubeUrl ?? ''
}
