import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const ThemeContext = createContext()

const THEMES = ['dark', 'light', 'system']

function getSystemTheme() {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getStoredTheme() {
  try {
    const stored = localStorage.getItem('portfolio-theme')
    if (THEMES.includes(stored)) return stored
  } catch {}
  return 'dark'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getStoredTheme)
  const [resolved, setResolved] = useState(() => theme === 'system' ? getSystemTheme() : theme)

  const resolveTheme = useCallback((mode) => {
    return mode === 'system' ? getSystemTheme() : mode
  }, [])

  useEffect(() => {
    const next = resolveTheme(theme)
    setResolved(next)
    document.documentElement.setAttribute('data-theme', next)
    if (next === 'light') {
      document.documentElement.classList.add('theme-light')
      document.documentElement.classList.remove('theme-dark')
    } else {
      document.documentElement.classList.add('theme-dark')
      document.documentElement.classList.remove('theme-light')
    }
  }, [theme, resolveTheme])

  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => {
      const next = e.matches ? 'dark' : 'light'
      setResolved(next)
      document.documentElement.setAttribute('data-theme', next)
      if (next === 'light') {
        document.documentElement.classList.add('theme-light')
        document.documentElement.classList.remove('theme-dark')
      } else {
        document.documentElement.classList.add('theme-dark')
        document.documentElement.classList.remove('theme-light')
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const changeTheme = useCallback((newTheme) => {
    if (!THEMES.includes(newTheme)) return
    setTheme(newTheme)
    try { localStorage.setItem('portfolio-theme', newTheme) } catch {}
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, resolved, changeTheme, isDark: resolved === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
