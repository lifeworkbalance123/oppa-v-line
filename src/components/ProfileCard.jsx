import { useEffect, useMemo, useState } from 'react'
import {
  buildShareReportMailto,
  getDisplayName,
  getProfileAvatarInitials,
  loadProfileStats,
  loadWeeklyReport,
} from '../lib/profileStats'
import './ProfileCard.css'

function StatCard({ label, value }) {
  return (
    <article className="profile-card__stat">
      <p className="profile-card__stat-value">{value}</p>
      <p className="profile-card__stat-label">{label}</p>
    </article>
  )
}

function WeeklyReportPreview({ memberName, stats, report, onClose }) {
  return (
    <div className="profile-card__modal" role="dialog" aria-modal="true" aria-labelledby="weekly-report-title">
      <button
        type="button"
        className="profile-card__modal-backdrop"
        onClick={onClose}
        aria-label="Close weekly report preview"
      />
      <div className="profile-card__modal-panel">
        <header className="profile-card__modal-header">
          <div>
            <h3 id="weekly-report-title" className="profile-card__modal-title">
              Weekly Report
            </h3>
            <p className="profile-card__modal-subtitle">{report.weekLabel}</p>
          </div>
          <button
            type="button"
            className="profile-card__modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="profile-card__modal-body">
          <p className="profile-card__modal-member">{memberName}</p>

          <ul className="profile-card__modal-stats">
            <li>
              <span>Days logged</span>
              <strong>{report.daysLogged}</strong>
            </li>
            <li>
              <span>Full sessions</span>
              <strong>{report.fullSessions}</strong>
            </li>
            <li>
              <span>Total steps</span>
              <strong>{report.totalSteps.toLocaleString()}</strong>
            </li>
            <li>
              <span>Avg puffiness</span>
              <strong>{report.avgPuffiness ?? 'N/A'}</strong>
            </li>
          </ul>

          <div className="profile-card__modal-puffiness">
            <h4 className="profile-card__modal-section-title">Daily puffiness</h4>
            <ul className="profile-card__puffiness-list">
              {report.puffinessByDay.map((day) => (
                <li key={day.dateKey}>
                  <span>{day.day}</span>
                  <span>{day.value != null ? `${day.value}/5` : '—'}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="profile-card__modal-footnote">
            All-time: {stats.daysLogged} days logged · {stats.fullSessions} sessions · {stats.totalSteps.toLocaleString()} steps
          </p>
        </div>
      </div>
    </div>
  )
}

function ProfileCard({ user }) {
  const [stats, setStats] = useState(() => loadProfileStats())
  const [report, setReport] = useState(() => loadWeeklyReport())
  const [showPreview, setShowPreview] = useState(false)

  const memberName = getDisplayName(user)
  const initials = getProfileAvatarInitials(user)

  useEffect(() => {
    const refresh = () => {
      setStats(loadProfileStats())
      setReport(loadWeeklyReport())
    }

    refresh()
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [])

  const shareMailto = useMemo(
    () => buildShareReportMailto(memberName, user?.email, stats, report),
    [memberName, user?.email, stats, report],
  )

  return (
    <section className="profile-card">
      <header className="profile-card__header">
        <div className="profile-card__avatar" aria-hidden="true">
          {initials}
        </div>
        <div>
          <h1 className="profile-card__name">{memberName}</h1>
          {user?.email && (
            <p className="profile-card__email">{user.email}</p>
          )}
          {!user && (
            <p className="profile-card__guest-note">
              Sign in from Home to sync your profile
            </p>
          )}
        </div>
      </header>

      <div className="profile-card__stats">
        <StatCard label="Days logged" value={stats.daysLogged} />
        <StatCard label="Full sessions" value={stats.fullSessions} />
        <StatCard label="Total steps" value={stats.totalSteps.toLocaleString()} />
      </div>

      <section className="profile-card__report">
        <div className="profile-card__report-copy">
          <h2 className="profile-card__report-title">Weekly Report</h2>
          <p className="profile-card__report-subtitle">
            {report.weekLabel} · {report.daysLogged} days logged this week
          </p>
        </div>

        <div className="profile-card__report-actions">
          <button
            type="button"
            className="profile-card__btn profile-card__btn--secondary"
            onClick={() => setShowPreview(true)}
          >
            Preview Report
          </button>
          <a
            href={shareMailto}
            className="profile-card__btn profile-card__btn--primary"
          >
            Share via Email
          </a>
        </div>
      </section>

      {showPreview && (
        <WeeklyReportPreview
          memberName={memberName}
          stats={stats}
          report={report}
          onClose={() => setShowPreview(false)}
        />
      )}
    </section>
  )
}

export default ProfileCard
