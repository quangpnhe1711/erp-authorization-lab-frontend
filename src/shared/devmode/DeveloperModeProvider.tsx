import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'eal.developerMode'

interface DeveloperModeState {
  developerMode: boolean
  setDeveloperMode: (next: boolean) => void
}

const DeveloperModeContext = createContext<DeveloperModeState>({
  developerMode: false,
  setDeveloperMode: () => {},
})

/**
 * Developer mode is the one place implementation vocabulary is allowed: screen codes, record
 * scopes, field groups, API use-cases, raw error codes. Everywhere else the product speaks
 * business language. Off by default, remembered per browser, never enabled by data.
 */
export function DeveloperModeProvider({ children }: { children: ReactNode }) {
  const [developerMode, setDeveloperModeState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'on'
    } catch {
      return false
    }
  })

  const setDeveloperMode = useCallback((next: boolean) => {
    setDeveloperModeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off')
    } catch {
      /* private browsing — the toggle simply does not persist */
    }
  }, [])

  // Power users expect a keyboard route into diagnostics; Ctrl/Cmd + Alt + D.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.altKey && event.key.toLowerCase() === 'd') {
        event.preventDefault()
        setDeveloperMode(!developerMode)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [developerMode, setDeveloperMode])

  const value = useMemo(() => ({ developerMode, setDeveloperMode }), [developerMode, setDeveloperMode])
  return <DeveloperModeContext.Provider value={value}>{children}</DeveloperModeContext.Provider>
}

export function useDeveloperMode(): DeveloperModeState {
  return useContext(DeveloperModeContext)
}
