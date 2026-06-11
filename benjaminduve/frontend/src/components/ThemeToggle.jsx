import { useEffect, useState } from 'react'

const THEME_KEY = 'bdv_theme'

function getInitialTheme() {
  if (typeof document !== 'undefined') {
    return document.documentElement.dataset.theme || 'dark'
  }

  return 'dark'
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getInitialTheme)
  const isDark = theme === 'dark'

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  return (
    <button
      type="button"
      className={`theme-toggle ${isDark ? 'is-dark' : 'is-light'}`}
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label="Cambiar tema"
      title={isDark ? 'Tema oscuro activo' : 'Tema claro activo'}
    >
      <span className="theme-toggle-track" aria-hidden="true">
        <span className="theme-toggle-icon theme-toggle-sun">
          <svg viewBox="0 0 24 24" focusable="false">
            <circle cx="12" cy="12" r="3.5"></circle>
            <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"></path>
          </svg>
        </span>
        <span className="theme-toggle-icon theme-toggle-moon">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M17.4 15.6A7.2 7.2 0 0 1 8.4 6.6 7.4 7.4 0 1 0 17.4 15.6Z"></path>
          </svg>
        </span>
        <span className="theme-toggle-thumb"></span>
      </span>
    </button>
  )
}
