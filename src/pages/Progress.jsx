import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ProgressGraph from '../components/ProgressGraph'
import WalkProgress from '../components/WalkProgress'
import SkincareRoutine from '../components/SkincareRoutine'
import NightlyCheckIn from '../components/NightlyCheckIn'
import StreakTracker from '../components/StreakTracker'
import MaintenanceModePanel from '../components/MaintenanceModePanel'
import { useStreakTracker } from '../hooks/useStreakTracker'
import './Progress.css'

function Progress() {
  const navigate = useNavigate()
  const { snapshot } = useStreakTracker()

  useEffect(() => {
    if (snapshot.shouldShowCelebration) {
      navigate('/celebration')
    }
  }, [snapshot.shouldShowCelebration, navigate])

  return (
    <section className="progress-page">
      <header className="progress-page__header">
        <h1 className="progress-page__title">Progress</h1>
        <p className="progress-page__text">
          Track your 42-day streak, walks, skincare, and nightly check-in.
        </p>
      </header>

      <StreakTracker />
      <MaintenanceModePanel />

      <div className="progress-page__photo-link-wrap">
        <Link to="/photos" className="progress-page__photo-link">
          View progress photos
        </Link>
      </div>

      <ProgressGraph />
      <WalkProgress />
      <SkincareRoutine />
      <NightlyCheckIn />
    </section>
  )
}

export default Progress
