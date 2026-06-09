import { createContext, useContext, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import BottomTabNav from './components/BottomTabNav'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import Dashboard from './pages/Dashboard'
import Checkout from './pages/Checkout'
import Progress from './pages/Progress'
import Library from './pages/Library'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import Routine from './pages/Routine'
import './App.css'

const AuthContext = createContext(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within App')
  }
  return context
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

function TabLayout() {
  return (
    <div className="app-shell">
      <main className="app-shell__content">
        <Outlet />
      </main>
      <BottomTabNav />
    </div>
  )
}

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

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

  const signOut = () => supabase?.auth.signOut()

  const authValue = {
    user,
    loading,
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
        <Routes>
          <Route element={<TabLayout />}>
            <Route path="/home" element={<Dashboard />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/library" element={<Library />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/routine" element={<Routine />} />
          </Route>
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/dashboard" element={<Navigate to="/home" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  )
}

export default App
