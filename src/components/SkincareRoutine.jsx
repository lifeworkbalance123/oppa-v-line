import { useEffect, useState } from 'react'
import './SkincareRoutine.css'

const STORAGE_KEY = 'oppa-v-line-skincare'

const DEFAULT_ITEMS = [
  { id: 'cleanse', label: 'Cleanse' },
  { id: 'moisturize', label: 'Moisturize' },
  { id: 'sunscreen', label: 'Sunscreen' },
]

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

function createEmptyCompletion(items) {
  return items.reduce((acc, item) => {
    acc[item.id] = false
    return acc
  }, {})
}

function loadSkincareData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return {
        items: DEFAULT_ITEMS,
        completion: createEmptyCompletion(DEFAULT_ITEMS),
      }
    }

    const parsed = JSON.parse(stored)
    const items = Array.isArray(parsed.items) && parsed.items.length > 0
      ? parsed.items
      : DEFAULT_ITEMS

    const todayCompletion = parsed.completion?.[getTodayKey()] ?? {}
    const completion = createEmptyCompletion(items)

    items.forEach((item) => {
      completion[item.id] = Boolean(todayCompletion[item.id])
    })

    return { items, completion }
  } catch {
    return {
      items: DEFAULT_ITEMS,
      completion: createEmptyCompletion(DEFAULT_ITEMS),
    }
  }
}

function SkincareRoutine() {
  const [items] = useState(() => loadSkincareData().items)
  const [completion, setCompletion] = useState(() => loadSkincareData().completion)

  const completedCount = Object.values(completion).filter(Boolean).length

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const parsed = stored ? JSON.parse(stored) : { items, completion: {} }
      parsed.items = items
      parsed.completion = parsed.completion ?? {}
      parsed.completion[getTodayKey()] = completion
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
    } catch {
      // Ignore storage errors.
    }
  }, [completion, items])

  const toggleItem = (itemId) => {
    setCompletion((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }))
  }

  return (
    <section className="skincare-routine">
      <header className="skincare-routine__header">
        <h2 className="skincare-routine__title">Skincare Routine</h2>
        <p className="skincare-routine__summary">
          {completedCount}/{items.length} completed today
        </p>
      </header>

      <ul className="skincare-routine__list">
        {items.map((item) => {
          const isComplete = completion[item.id]

          return (
            <li key={item.id}>
              <button
                type="button"
                className={`skincare-routine__item${isComplete ? ' skincare-routine__item--done' : ''}`}
                onClick={() => toggleItem(item.id)}
                aria-pressed={isComplete}
              >
                <span className="skincare-routine__check" aria-hidden="true">
                  {isComplete ? '✓' : ''}
                </span>
                <span className="skincare-routine__label">{item.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default SkincareRoutine
