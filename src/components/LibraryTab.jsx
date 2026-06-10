import ExerciseLibrary from './ExerciseLibrary'
import BonusGuidesSection from './BonusGuidesSection'
import { usePremium } from '../hooks/usePremium'
import './LibraryTab.css'

function LibraryTab() {
  const {
    isPremium,
    loading: upgradeLoading,
    error: upgradeError,
    handleUpgrade,
    clearError,
  } = usePremium()

  return (
    <div className="library-tab">
      <header className="library-tab__header">
        <h1 className="library-tab__title">Library</h1>
        <p className="library-tab__subtitle">
          Free exercises and premium bonus guides
        </p>
      </header>

      <ExerciseLibrary asSection />
      <BonusGuidesSection
        isPremium={isPremium}
        onUpgrade={handleUpgrade}
        upgradeLoading={upgradeLoading}
        upgradeError={upgradeError}
        onClearUpgradeError={clearError}
      />
    </div>
  )
}

export default LibraryTab
