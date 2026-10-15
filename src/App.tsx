import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import ProjectsPage from './pages/ProjectsPage'
import AboutPage from './pages/AboutPage'
import LoginPage from './pages/LoginPage'
import useLocalStorage from './hooks/useLocalStorage'
import { useAuthStore } from './store/useAuthStore'

function App() {
  const [darkMode, setDarkMode] = useLocalStorage<boolean>('dark-mode', false)
  const restoreSession = useAuthStore((state) => state.restoreSession)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  // The access token is only kept in memory, so after a reload we ask the
  // backend for a new one using the httpOnly refresh cookie.
  useEffect(() => {
    restoreSession()
  }, [restoreSession])

  return (
    <>
      {/* Skip link: lets keyboard users jump past the nav straight to the content.
          Flagged by axe DevTools as "bypass blocks of repeated content". */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-20 focus:rounded focus:bg-primaryStrong focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>

      <Navbar darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)} />
      <main id="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}

export default App
