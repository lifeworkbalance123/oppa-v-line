const STORAGE_KEYS = {
  puffiness: 'oppa-v-line-puffiness',
  nightly: 'oppa-v-line-nightly-checkin',
  walk: 'oppa-v-line-walk-progress',
  trackers: 'oppa-v-line-trackers',
  completed: 'oppa-v-line-completed-exercises',
  library: 'oppa-v-line-library-progress',
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

function parseJson(key, fallback) {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : fallback
  } catch {
    return fallback
  }
}

export function getDisplayName(user) {
  if (!user) return 'Guest'
  const metadata = user.user_metadata ?? {}
  return (
    metadata.full_name
    || metadata.name
    || user.email?.split('@')[0]
    || 'Member'
  )
}

function getMemberInitials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'G'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function getLast7DayKeys() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (6 - index))
    return date.toISOString().slice(0, 10)
  })
}

function getLoggedDates() {
  const dates = new Set()
  const puffiness = parseJson(STORAGE_KEYS.puffiness, {})
  const nightly = parseJson(STORAGE_KEYS.nightly, {})

  Object.keys(puffiness).forEach((date) => {
    const value = Number(puffiness[date])
    if (value >= 1 && value <= 5) dates.add(date)
  })

  Object.keys(nightly).forEach((date) => {
    if (nightly[date]) dates.add(date)
  })

  return dates
}

function countLibraryFullSessions(libraryProgress) {
  return Object.values(libraryProgress).filter(
    (sets) => Array.isArray(sets) && sets.length > 0 && sets.every(Boolean),
  ).length
}

function getStepsByDate() {
  const walk = parseJson(STORAGE_KEYS.walk, {})
  const trackers = parseJson(STORAGE_KEYS.trackers, {})
  const today = getTodayKey()
  const byDate = { ...walk }

  const trackerSteps = Math.max(0, Number(trackers.steps) || 0)
  byDate[today] = Math.max(byDate[today] || 0, trackerSteps)

  return byDate
}

function sumStepsForDates(dateKeys, stepsByDate) {
  return dateKeys.reduce((sum, date) => sum + Math.max(0, Number(stepsByDate[date]) || 0), 0)
}

function getPuffinessForWeek(weekDates) {
  const puffiness = parseJson(STORAGE_KEYS.puffiness, {})

  return weekDates.map((dateKey) => {
    const value = Number(puffiness[dateKey])
    const date = new Date(`${dateKey}T12:00:00`)
    return {
      dateKey,
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      value: value >= 1 && value <= 5 ? value : null,
    }
  })
}

export function loadProfileStats() {
  const loggedDates = getLoggedDates()
  const nightly = parseJson(STORAGE_KEYS.nightly, {})
  const completed = parseJson(STORAGE_KEYS.completed, [])
  const library = parseJson(STORAGE_KEYS.library, {})
  const stepsByDate = getStepsByDate()

  const nightlyCompletions = Object.values(nightly).filter(
    (entry) => entry?.completedAt,
  ).length
  const dashboardCompletions = Array.isArray(completed) ? completed.length : 0
  const libraryCompletions = countLibraryFullSessions(library)

  return {
    daysLogged: loggedDates.size,
    fullSessions: nightlyCompletions + dashboardCompletions + libraryCompletions,
    totalSteps: Object.values(stepsByDate).reduce(
      (sum, steps) => sum + Math.max(0, Number(steps) || 0),
      0,
    ),
  }
}

export function loadWeeklyReport() {
  const weekDates = getLast7DayKeys()
  const loggedDates = getLoggedDates()
  const nightly = parseJson(STORAGE_KEYS.nightly, {})
  const stepsByDate = getStepsByDate()
  const puffinessByDay = getPuffinessForWeek(weekDates)

  const weekLoggedDays = weekDates.filter((date) => loggedDates.has(date)).length
  const weekFullSessions = weekDates.filter(
    (date) => nightly[date]?.completedAt,
  ).length
  const weekSteps = sumStepsForDates(weekDates, stepsByDate)

  const puffinessValues = puffinessByDay
    .map((day) => day.value)
    .filter((value) => value != null)
  const avgPuffiness = puffinessValues.length
    ? (puffinessValues.reduce((sum, value) => sum + value, 0) / puffinessValues.length).toFixed(1)
    : null

  const startDate = new Date(`${weekDates[0]}T12:00:00`)
  const endDate = new Date(`${weekDates[weekDates.length - 1]}T12:00:00`)
  const weekLabel = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

  return {
    weekLabel,
    daysLogged: weekLoggedDays,
    fullSessions: weekFullSessions,
    totalSteps: weekSteps,
    avgPuffiness,
    puffinessByDay,
  }
}

export function formatWeeklyReportText(memberName, stats, report) {
  const puffinessLines = report.puffinessByDay
    .map((day) => {
      const rating = day.value != null ? `${day.value}/5` : 'Not logged'
      return `- ${day.day}: ${rating}`
    })
    .join('\n')

  return [
    `Oppa V-Line Weekly Report`,
    `Member: ${memberName}`,
    `Week: ${report.weekLabel}`,
    '',
    'Summary',
    `- Days logged: ${report.daysLogged}`,
    `- Full sessions: ${report.fullSessions}`,
    `- Total steps: ${report.totalSteps.toLocaleString()}`,
    `- Avg puffiness: ${report.avgPuffiness ?? 'N/A'}`,
    '',
    'All-time stats',
    `- Days logged: ${stats.daysLogged}`,
    `- Full sessions: ${stats.fullSessions}`,
    `- Total steps: ${stats.totalSteps.toLocaleString()}`,
    '',
    'Daily puffiness',
    puffinessLines,
    '',
    'Keep going — consistency builds your V-line.',
  ].join('\n')
}

export function buildShareReportMailto(memberName, userEmail, stats, report) {
  const subject = `Oppa V-Line Weekly Report — ${report.weekLabel}`
  const body = formatWeeklyReportText(memberName, stats, report)
  const recipient = userEmail ? encodeURIComponent(userEmail) : ''
  const params = new URLSearchParams({
    subject,
    body,
  })

  return `mailto:${recipient}?${params.toString()}`
}

export function getProfileAvatarInitials(user) {
  return getMemberInitials(getDisplayName(user))
}
