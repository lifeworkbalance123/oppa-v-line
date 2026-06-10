export const STREAK_STORAGE_KEY = 'oppa-v-line-42-day-streak'
export const DAILY_EXERCISES_KEY = 'oppa-v-line-daily-exercise-completions'
export const STREAK_UPDATED_EVENT = 'oppa-v-line-streak-updated'
export const PROGRAM_DAYS = 42
export const CORE_EXERCISE_IDS = ['posture-reset', 'vertical-lift']
export const MAINTENANCE_EXERCISE_IDS = ['posture-reset', 'vertical-lift', 'midline-v-press']
export const MAINTENANCE_SESSIONS_PER_WEEK = 3

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

function parseDate(dateKey) {
  return new Date(`${dateKey}T12:00:00`)
}

function formatDateKey(date) {
  return date.toISOString().slice(0, 10)
}

function addDays(dateKey, days) {
  const date = parseDate(dateKey)
  date.setDate(date.getDate() + days)
  return formatDateKey(date)
}

function getWeekKey(dateKey = getTodayKey()) {
  const date = parseDate(dateKey)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(date)
  monday.setDate(diff)
  return formatDateKey(monday)
}

function createDefaultState() {
  return {
    programMode: 'daily',
    challengeDays: [],
    graceAvailable: true,
    lastReconciledDate: null,
    challengeCompletedAt: null,
    celebrationSeen: false,
    maintenanceSessions: {},
    maintenanceWeekStreak: 0,
  }
}

export function loadStreakState() {
  try {
    const stored = localStorage.getItem(STREAK_STORAGE_KEY)
    if (!stored) return createDefaultState()
    const parsed = JSON.parse(stored)
    return {
      ...createDefaultState(),
      ...parsed,
      challengeDays: Array.isArray(parsed.challengeDays) ? parsed.challengeDays : [],
      maintenanceSessions: parsed.maintenanceSessions ?? {},
    }
  } catch {
    return createDefaultState()
  }
}

export function saveStreakState(state) {
  localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(state))
  window.dispatchEvent(new CustomEvent(STREAK_UPDATED_EVENT))
}

function countMissedDays(challengeDays, today) {
  if (challengeDays.length === 0) return 0

  const lastComplete = challengeDays[challengeDays.length - 1]
  let missed = 0
  let cursor = addDays(lastComplete, 1)

  while (cursor < today) {
    if (!challengeDays.includes(cursor)) {
      missed += 1
    }
    cursor = addDays(cursor, 1)
  }

  return missed
}

export function reconcileStreak(state, today = getTodayKey()) {
  if (state.programMode === 'maintenance' || state.challengeDays.length >= PROGRAM_DAYS) {
    return { ...state, lastReconciledDate: today }
  }

  if (state.lastReconciledDate === today) {
    return state
  }

  const missed = countMissedDays(state.challengeDays, today)

  if (missed === 0) {
    return { ...state, lastReconciledDate: today }
  }

  if (missed === 1 && state.graceAvailable) {
    return {
      ...state,
      graceAvailable: false,
      lastReconciledDate: today,
    }
  }

  return {
    ...state,
    challengeDays: [],
    graceAvailable: true,
    lastReconciledDate: today,
  }
}

export function loadDailyExerciseCompletions() {
  try {
    const stored = localStorage.getItem(DAILY_EXERCISES_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

export function syncDailyExerciseCompletion(dateKey, completedIds) {
  try {
    const stored = loadDailyExerciseCompletions()
    stored[dateKey] = Array.isArray(completedIds) ? completedIds : []
    localStorage.setItem(DAILY_EXERCISES_KEY, JSON.stringify(stored))
  } catch {
    // Ignore storage errors.
  }
}

export function isCoreCompleteForDate(dateKey, completions = loadDailyExerciseCompletions()) {
  const completed = completions[dateKey] ?? []
  return CORE_EXERCISE_IDS.every((id) => completed.includes(id))
}

export function isCoreCompleteToday() {
  return isCoreCompleteForDate(getTodayKey())
}

function updateMaintenanceWeekStreak(maintenanceSessions) {
  let streak = 0
  let week = getWeekKey()

  for (let index = 0; index < 52; index += 1) {
    const sessions = maintenanceSessions[week] ?? []
    if (sessions.length >= MAINTENANCE_SESSIONS_PER_WEEK) {
      streak += 1
      const date = parseDate(week)
      date.setDate(date.getDate() - 7)
      week = formatDateKey(date)
    } else {
      break
    }
  }

  return streak
}

export function recordMaintenanceSession(dateKey = getTodayKey()) {
  let state = reconcileStreak(loadStreakState(), dateKey)
  const weekKey = getWeekKey(dateKey)
  const sessions = state.maintenanceSessions[weekKey] ?? []

  if (!sessions.includes(dateKey)) {
    sessions.push(dateKey)
    state = {
      ...state,
      maintenanceSessions: {
        ...state.maintenanceSessions,
        [weekKey]: sessions.sort(),
      },
    }
    state.maintenanceWeekStreak = updateMaintenanceWeekStreak(state.maintenanceSessions)
    saveStreakState(state)
  }

  return state
}

export function recordCoreCompletion(dateKey = getTodayKey()) {
  let state = reconcileStreak(loadStreakState(), dateKey)

  if (state.programMode === 'maintenance') {
    return recordMaintenanceSession(dateKey)
  }

  if (state.challengeDays.includes(dateKey)) {
    saveStreakState({ ...state, lastReconciledDate: dateKey })
    return state
  }

  if (!isCoreCompleteForDate(dateKey)) {
    return state
  }

  state = {
    ...state,
    challengeDays: [...state.challengeDays, dateKey].sort(),
    graceAvailable: true,
    lastReconciledDate: dateKey,
  }

  if (state.challengeDays.length >= PROGRAM_DAYS && !state.challengeCompletedAt) {
    state.challengeCompletedAt = new Date().toISOString()
  }

  saveStreakState(state)
  return state
}

export function tryRecordCoreCompletionFromExercises(completedIds, dateKey = getTodayKey()) {
  syncDailyExerciseCompletion(dateKey, completedIds)
  if (CORE_EXERCISE_IDS.every((id) => completedIds.includes(id))) {
    return recordCoreCompletion(dateKey)
  }
  return reconcileStreak(loadStreakState(), dateKey)
}

export function setProgramMode(mode) {
  const state = loadStreakState()
  const next = { ...state, programMode: mode === 'maintenance' ? 'maintenance' : 'daily' }
  saveStreakState(next)
  return next
}

export function markCelebrationSeen() {
  const state = loadStreakState()
  const next = { ...state, celebrationSeen: true }
  saveStreakState(next)
  return next
}

export function getStreakSnapshot(state = loadStreakState()) {
  const today = getTodayKey()
  const reconciled = reconcileStreak(state, today)
  const completedCount = Math.min(reconciled.challengeDays.length, PROGRAM_DAYS)
  const isChallengeComplete = completedCount >= PROGRAM_DAYS
  const todayComplete = reconciled.challengeDays.includes(today)
  const currentDayIndex = todayComplete
    ? completedCount - 1
    : completedCount

  const weekKey = getWeekKey(today)
  const maintenanceThisWeek = (reconciled.maintenanceSessions[weekKey] ?? []).length

  return {
    state: reconciled,
    today,
    completedCount,
    isChallengeComplete,
    todayComplete,
    currentDayIndex,
    progressPercent: Math.round((completedCount / PROGRAM_DAYS) * 100),
    graceAvailable: reconciled.graceAvailable,
    programMode: reconciled.programMode,
    maintenanceThisWeek,
    maintenanceWeekStreak: reconciled.maintenanceWeekStreak,
    shouldShowCelebration: isChallengeComplete && !reconciled.celebrationSeen,
  }
}

export function getCelebrationStats() {
  const puffiness = (() => {
    try {
      const stored = localStorage.getItem('oppa-v-line-puffiness')
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  })()

  const ratings = Object.entries(puffiness)
    .map(([date, value]) => ({ date, value: Number(value) }))
    .filter((entry) => entry.value >= 1 && entry.value <= 5)
    .sort((a, b) => a.date.localeCompare(b.date))

  const first = ratings[0]?.value ?? null
  const last = ratings[ratings.length - 1]?.value ?? null
  const improvement = first != null && last != null ? last - first : null

  let totalSteps = 0
  try {
    const walk = JSON.parse(localStorage.getItem('oppa-v-line-walk-progress') ?? '{}')
    const trackers = JSON.parse(localStorage.getItem('oppa-v-line-trackers') ?? '{}')
    const walkTotal = Object.values(walk).reduce((sum, steps) => sum + (Number(steps) || 0), 0)
    const trackerSteps = Math.max(0, Number(trackers.steps) || 0)
    totalSteps = walkTotal + trackerSteps
  } catch {
    // Ignore.
  }

  let photosTaken = 0
  try {
    const photos = JSON.parse(localStorage.getItem('oppa-v-line-progress-photos') ?? '{"photos":[]}')
    photosTaken = Array.isArray(photos.photos) ? photos.photos.length : 0
  } catch {
    // Ignore.
  }

  const snapshot = getStreakSnapshot()

  return {
    streakLength: snapshot.completedCount,
    totalSteps,
    photosTaken,
    puffinessStart: first,
    puffinessEnd: last,
    puffinessImprovement: improvement,
  }
}
