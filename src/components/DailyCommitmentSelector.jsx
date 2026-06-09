import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  COMMITMENT_OPTIONS,
  loadSelectedCommitment,
  saveSelectedCommitment,
} from '../lib/dailyCommitment'
import './DailyCommitmentSelector.css'

function CommitmentCard({ option, isSelected, onSelect }) {
  return (
    <button
      type="button"
      className={`daily-commitment__card${isSelected ? ' daily-commitment__card--selected' : ''}`}
      onClick={() => onSelect(option.id)}
      aria-pressed={isSelected}
    >
      <div className="daily-commitment__card-header">
        <span className="daily-commitment__icon" aria-hidden="true">
          {option.icon}
        </span>
        <div className="daily-commitment__card-titles">
          <h3 className="daily-commitment__card-title">{option.title}</h3>
          <p className="daily-commitment__card-time">{option.time}</p>
        </div>
      </div>
      <ul className="daily-commitment__includes">
        {option.includes.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </button>
  )
}

function DailyCommitmentSelector() {
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState(loadSelectedCommitment)

  const handleSelect = (commitmentId) => {
    setSelectedId(commitmentId)
    saveSelectedCommitment(commitmentId)
  }

  const handleStartRoutine = () => {
    saveSelectedCommitment(selectedId)
    navigate('/routine')
  }

  const selectedOption = COMMITMENT_OPTIONS.find((option) => option.id === selectedId)

  return (
    <section className="daily-commitment" aria-labelledby="daily-commitment-title">
      <header className="daily-commitment__header">
        <h2 id="daily-commitment-title" className="daily-commitment__title">
          Daily Commitment
        </h2>
        <p className="daily-commitment__subtitle">
          Choose how much time you have today
        </p>
      </header>

      <div className="daily-commitment__options" role="group" aria-label="Daily commitment level">
        {COMMITMENT_OPTIONS.map((option) => (
          <CommitmentCard
            key={option.id}
            option={option}
            isSelected={selectedId === option.id}
            onSelect={handleSelect}
          />
        ))}
      </div>

      <button
        type="button"
        className="daily-commitment__start"
        onClick={handleStartRoutine}
      >
        START ROUTINE
        {selectedOption && (
          <span className="daily-commitment__start-meta">
            {selectedOption.icon} {selectedOption.title} · {selectedOption.time}
          </span>
        )}
      </button>
    </section>
  )
}

export default DailyCommitmentSelector
