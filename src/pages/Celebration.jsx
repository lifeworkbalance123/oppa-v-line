import { Navigate } from 'react-router-dom'
import CelebrationScreen from '../components/CelebrationScreen'
import { getStreakSnapshot } from '../lib/streakTracking'

function Celebration() {
  const { isChallengeComplete } = getStreakSnapshot()

  if (!isChallengeComplete) {
    return <Navigate to="/progress" replace />
  }

  return <CelebrationScreen />
}

export default Celebration
