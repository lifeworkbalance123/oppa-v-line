import { createContext, useContext, useEffect, useState } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import Dashboard from './pages/Dashboard'
import Checkout from './pages/Checkout'
import './App.css'

const AuthContext = createContext(null)
const THEME_STORAGE_KEY = 'oppa-v-line-theme'

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within App')
  }
  return context
}

function getInitialTheme() {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') {
    return stored
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function LoadingScreen() {
  return (
    <div className="app-loading" role="status" aria-live="polite">
      <div className="app-loading__spinner" aria-hidden="true" />
      <p className="app-loading__text">Loading...</p>
    </div>
  )
}

function ConfigErrorScreen() {
  return (
    <div className="app-loading app-loading--error" role="alert">
      <h1 className="app-loading__title">Configuration required</h1>
      <p className="app-loading__text">
        Supabase environment variables are missing from this build. Add
        {' '}
        <code>VITE_SUPABASE_URL</code>
        {' '}
        and
        {' '}
        <code>VITE_SUPABASE_ANON_KEY</code>
        {' '}
        in Vercel, then redeploy.
      </p>
    </div>
  )
}

function AppLayout({ children, darkMode, onToggleDarkMode, user, onSignOut }) {
  return (
    <div className="app">
      <header className="app-header">
        <nav className="app-nav" aria-label="Main navigation">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/checkout">Checkout</Link>
        </nav>
        <div className="app-header__actions">
          {user && (
            <span className="app-user">{user.email}</span>
          )}
          <button
            type="button"
            className="theme-toggle"
            onClick={onToggleDarkMode}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? 'Light' : 'Dark'}
          </button>
          {user && (
            <button type="button" className="sign-out" onClick={onSignOut}>
              Sign out
            </button>
          )}
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  )
}

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(getInitialTheme)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false)
      return undefined
    }

    let cancelled = false

    const finishLoading = (session) => {
      if (!cancelled) {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    }

    const timeoutId = window.setTimeout(() => {
      if (!cancelled) {
        setLoading(false)
      }
    }, 8000)

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        finishLoading(session)
      })
      .catch(() => {
        finishLoading(null)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      finishLoading(session)
    })

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode)
    localStorage.setItem(THEME_STORAGE_KEY, darkMode)
  }, [darkMode])

  const toggleDarkMode = () => {
    setDarkMode((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const signOut = () => supabase?.auth.signOut()

  const authValue = {
    user,
    loading,
    darkMode,
    toggleDarkMode,
    signOut,
  }

  if (!isSupabaseConfigured) {
    return <ConfigErrorScreen />
  }

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <AuthContext.Provider value={authValue}>
      <BrowserRouter>
        <AppLayout
          darkMode={darkMode === 'dark'}
          onToggleDarkMode={toggleDarkMode}
          user={user}
          onSignOut={signOut}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/checkout" element={<Checkout />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AuthContext.Provider>
  )
}

export default App
