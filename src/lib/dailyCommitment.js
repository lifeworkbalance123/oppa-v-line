export const COMMITMENT_STORAGE_KEY = 'oppa-v-line-daily-commitment'

export const COMMITMENT_OPTIONS = [
  {
    id: 'core',
    icon: '⚡',
    title: 'CORE',
    time: '2 min',
    includes: ['Posture Reset', 'Vertical Lift'],
    exerciseIds: ['posture-reset', 'vertical-lift'],
    showTrackers: false,
    showSkincare: false,
  },
  {
    id: 'complete',
    icon: '📋',
    title: 'COMPLETE',
    time: '4 min',
    includes: [
      'Posture Reset + Vertical Lift',
      'Midline V-Press',
      'Daily logging trackers',
    ],
    exerciseIds: ['posture-reset', 'vertical-lift', 'midline-v-press'],
    showTrackers: true,
    showSkincare: false,
  },
  {
    id: 'skincare',
    icon: '🧴',
    title: 'WITH SKINCARE',
    time: '5 min',
    includes: [
      'Complete routine (all exercises)',
      'Daily logging trackers',
      'Jojoba oil application',
    ],
    exerciseIds: ['posture-reset', 'vertical-lift', 'midline-v-press'],
    showTrackers: true,
    showSkincare: true,
  },
]

const DEFAULT_COMMITMENT_ID = 'core'

export function loadSelectedCommitment() {
  try {
    const stored = localStorage.getItem(COMMITMENT_STORAGE_KEY)
    const isValid = COMMITMENT_OPTIONS.some((option) => option.id === stored)
    return isValid ? stored : DEFAULT_COMMITMENT_ID
  } catch {
    return DEFAULT_COMMITMENT_ID
  }
}

export function saveSelectedCommitment(commitmentId) {
  localStorage.setItem(COMMITMENT_STORAGE_KEY, commitmentId)
}

export function getCommitmentById(commitmentId) {
  return COMMITMENT_OPTIONS.find((option) => option.id === commitmentId)
    ?? COMMITMENT_OPTIONS[0]
}
