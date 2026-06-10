import { useCallback, useEffect, useState } from 'react'
import {
  getStreakSnapshot,
  loadStreakState,
  reconcileStreak,
  saveStreakState,
  STREAK_UPDATED_EVENT,
} from '../lib/streakTracking'

export function useStreakTracker() {
  const [snapshot, setSnapshot] = useState(() => getStreakSnapshot())

  const refresh = useCallback(() => {
    const current = loadStreakState()
    const reconciled = reconcileStreak(current)
    if (JSON.stringify(current) !== JSON.stringify(reconciled)) {
      saveStreakState(reconciled)
    }
    setSnapshot(getStreakSnapshot(reconciled))
  }, [])

  useEffect(() => {
    refresh()
    window.addEventListener('focus', refresh)
    window.addEventListener(STREAK_UPDATED_EVENT, refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      window.removeEventListener(STREAK_UPDATED_EVENT, refresh)
    }
  }, [refresh])

  return { snapshot, refresh }
}
