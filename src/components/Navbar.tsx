import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

interface NavbarProps {
  darkMode: boolean
  onToggleDarkMode: () => void
}

const navLinkClass =
  'relative pb-1 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full'

function Navbar({ darkMode, onToggleDarkMode }: NavbarProps) {
  const { user, status, logout } = useAuthStore()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-bg">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-5">
        <Link to="/" className="font-mono font-medium text-primary">
          &lt;portofolio/&gt;
        </Link>
        <nav className="flex gap-6 text-sm font-medium">
          <Link to="/" className={navLinkClass}>Home</Link>
          <Link to="/projects" className={navLinkClass}>Projects</Link>
          <Link to="/about" className={navLinkClass}>About</Link>
        </nav>
        <div className="flex items-center gap-4 font-mono text-xs tracking-wide">
          {status === 'ready' &&
            (user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="text-muted hover:text-primary"
                title={`Logged in as ${user.email}`}
              >
                LOGOUT
              </button>
            ) : (
              <Link to="/login" className="text-muted hover:text-primary">LOGIN</Link>
            ))}
          <button
            type="button"
            onClick={onToggleDarkMode}
            aria-pressed={darkMode}
            className="text-muted hover:text-primary"
          >
            {darkMode ? 'LIGHT MODE' : 'DARK MODE'}
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
