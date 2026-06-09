import ProgressGraph from '../components/ProgressGraph'
import WalkProgress from '../components/WalkProgress'
import SkincareRoutine from '../components/SkincareRoutine'
import NightlyCheckIn from '../components/NightlyCheckIn'
import './Progress.css'

function Progress() {
  return (
    <section className="progress-page">
      <header className="progress-page__header">
        <h1 className="progress-page__title">Progress</h1>
        <p className="progress-page__text">
          Track your walks, skincare, and nightly check-in.
        </p>
      </header>

      <ProgressGraph />
      <WalkProgress />
      <SkincareRoutine />
      <NightlyCheckIn />
    </section>
  )
}

export default Progress
