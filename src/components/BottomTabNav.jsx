import { NavLink } from 'react-router-dom'
import './BottomTabNav.css'

const TABS = [
  { to: '/home', label: 'Home', icon: '🏠' },
  { to: '/progress', label: 'Progress', icon: '📊' },
  { to: '/library', label: 'Library', icon: '📚' },
  { to: '/profile', label: 'Profile', icon: '👤' },
  { to: '/admin', label: 'Admin', icon: '⚙️' },
]

function BottomTabNav() {
  return (
    <nav className="bottom-tabs" aria-label="Main navigation">
      <ul className="bottom-tabs__list">
        {TABS.map((tab) => (
          <li key={tab.to} className="bottom-tabs__item">
            <NavLink
              to={tab.to}
              className={({ isActive }) =>
                `bottom-tabs__link${isActive ? ' bottom-tabs__link--active' : ''}`
              }
              end={tab.to === '/home'}
            >
              <span className="bottom-tabs__icon" aria-hidden="true">
                {tab.icon}
              </span>
              <span className="bottom-tabs__label">{tab.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default BottomTabNav
