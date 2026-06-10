import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Confetti from './Confetti'
import {
  getCelebrationStats,
  markCelebrationSeen,
  setProgramMode,
} from '../lib/streakTracking'
import { downloadJourneyShareImage } from '../lib/shareJourneyImage'
import './CelebrationScreen.css'

function formatPuffinessTrend(stats) {
  if (stats.puffinessStart == null || stats.puffinessEnd == null) {
    return 'Keep logging morning puffiness to see your trend.'
  }

  const delta = stats.puffinessImprovement
  if (delta > 0) {
    return `Up ${delta} point${delta === 1 ? '' : 's'} (${stats.puffinessStart}/5 → ${stats.puffinessEnd}/5)`
  }
  if (delta < 0) {
    return `Down ${Math.abs(delta)} point${Math.abs(delta) === 1 ? '' : 's'} (${stats.puffinessStart}/5 → ${stats.puffinessEnd}/5)`
  }
  return `Held steady at ${stats.puffinessEnd}/5`
}

function CelebrationScreen() {
  const navigate = useNavigate()
  const stats = useMemo(() => getCelebrationStats(), [])

  const handleMaintenance = () => {
    markCelebrationSeen()
    setProgramMode('maintenance')
    navigate('/progress')
  }

  const handleShare = async () => {
    try {
      await downloadJourneyShareImage(stats)
    } catch {
      // Ignore share errors.
    }
  }

  const handleDismiss = () => {
    markCelebrationSeen()
    navigate('/progress')
  }

  return (
    <section className="celebration">
      <Confetti />

      <div className="celebration__content">
        <p className="celebration__emoji" aria-hidden="true">
          🎉
        </p>
        <h1 className="celebration__title">
          42 DAYS COMPLETE
        </h1>
        <p className="celebration__emoji" aria-hidden="true">
          🎉
        </p>
        <p className="celebration__subtitle">
          You finished the full 42-day CORE challenge.
        </p>

        <ul className="celebration__stats">
          <li>
            <span>Streak length</span>
            <strong>{stats.streakLength} days</strong>
          </li>
          <li>
            <span>Total steps</span>
            <strong>{stats.totalSteps.toLocaleString()}</strong>
          </li>
          <li>
            <span>Photos taken</span>
            <strong>{stats.photosTaken}</strong>
          </li>
          <li>
            <span>Puffiness trend</span>
            <strong>{formatPuffinessTrend(stats)}</strong>
          </li>
        </ul>

        <div className="celebration__actions">
          <Link to="/photos" className="celebration__btn celebration__btn--secondary">
            COMPARE YOUR PHOTOS
          </Link>
          <button
            type="button"
            className="celebration__btn celebration__btn--secondary"
            onClick={handleShare}
          >
            SHARE YOUR JOURNEY
          </button>
          <button
            type="button"
            className="celebration__btn celebration__btn--primary"
            onClick={handleMaintenance}
          >
            CONTINUE MAINTENANCE MODE
          </button>
          <button
            type="button"
            className="celebration__btn celebration__btn--ghost"
            onClick={handleDismiss}
          >
            Back to Progress
          </button>
        </div>
      </div>
    </section>
  )
}

export default CelebrationScreen
