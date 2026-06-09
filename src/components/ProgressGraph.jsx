import { useEffect, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import './ProgressGraph.css'

const PUFFINESS_STORAGE_KEY = 'oppa-v-line-puffiness'
const FALLBACK_RATINGS = [2, 3, 3, 4, 4, 4, 4]

const CATEGORY_COLORS = {
  puffy: '#4a90d9',
  neutral: '#3a7352',
  clear: '#d97706',
}

function getPuffinessCategory(value) {
  if (value <= 2) return 'puffy'
  if (value === 3) return 'neutral'
  return 'clear'
}

function getCategoryLabel(category) {
  if (category === 'puffy') return '1-2 Puffy'
  if (category === 'neutral') return '3 Neutral'
  return '4-5 Clear'
}

function getLast7Days() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (6 - index))
    return date
  })
}

function loadPuffinessHistory() {
  try {
    const stored = localStorage.getItem(PUFFINESS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

function buildChartData() {
  const stored = loadPuffinessHistory()
  const last7Days = getLast7Days()

  return last7Days.map((date, index) => {
    const dateKey = date.toISOString().slice(0, 10)
    const storedValue = Number(stored[dateKey])
    const value = storedValue >= 1 && storedValue <= 5
      ? storedValue
      : FALLBACK_RATINGS[index]
    const category = getPuffinessCategory(value)

    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      value,
      category,
      color: CATEGORY_COLORS[category],
      label: getCategoryLabel(category),
      fromStorage: storedValue >= 1 && storedValue <= 5,
    }
  })
}

function PuffinessDot({ cx, cy, payload }) {
  if (cx == null || cy == null || !payload) return null

  return (
    <circle
      cx={cx}
      cy={cy}
      r={6}
      fill={payload.color}
      stroke="var(--bg-primary)"
      strokeWidth={2}
    />
  )
}

function ProgressGraph() {
  const [chartData, setChartData] = useState(() => buildChartData())

  useEffect(() => {
    const refreshChart = () => setChartData(buildChartData())
    refreshChart()
    window.addEventListener('focus', refreshChart)
    return () => window.removeEventListener('focus', refreshChart)
  }, [])

  return (
    <section className="progress-graph">
      <header className="progress-graph__header">
        <h2 className="progress-graph__title">7-Day Puffiness</h2>
        <p className="progress-graph__subtitle">Morning puffiness ratings (1-5)</p>
      </header>

      <div className="progress-graph__card">
        <div className="progress-graph__chart">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
              />
              <YAxis
                domain={[1, 5]}
                ticks={[1, 2, 3, 4, 5]}
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
              />
              <Tooltip
                cursor={{ stroke: 'var(--accent-border)' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const point = payload[0].payload

                  return (
                    <div className="progress-graph__tooltip">
                      <p className="progress-graph__tooltip-day">{point.day}</p>
                      <p className="progress-graph__tooltip-value">
                        Rating: {point.value}/5
                      </p>
                      <p className="progress-graph__tooltip-label">{point.label}</p>
                    </div>
                  )
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--accent-hover)"
                strokeWidth={2}
                dot={<PuffinessDot />}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <ul className="progress-graph__legend">
          <li>
            <span className="progress-graph__legend-dot progress-graph__legend-dot--puffy" />
            🔵 1-2 Puffy
          </li>
          <li>
            <span className="progress-graph__legend-dot progress-graph__legend-dot--neutral" />
            🟢 3 Neutral
          </li>
          <li>
            <span className="progress-graph__legend-dot progress-graph__legend-dot--clear" />
            🟠 4-5 Clear
          </li>
        </ul>
      </div>
    </section>
  )
}

export default ProgressGraph
