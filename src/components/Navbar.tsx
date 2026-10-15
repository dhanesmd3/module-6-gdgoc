import { Link } from 'react-router-dom'

interface NavbarProps {
  darkMode: boolean
  onToggleDarkMode: () => void
}

const navLinkClass =
  'relative pb-1 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full'

function Navbar({ darkMode, onToggleDarkMode }: NavbarProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-bg">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <Link to="/" className="font-mono font-medium text-primary">
          &lt;portofolio/&gt;
        </Link>
        <nav className="flex gap-6 text-sm font-medium">
          <Link to="/" className={navLinkClass}>Home</Link>
          <Link to="/projects" className={navLinkClass}>Projects</Link>
          <Link to="/about" className={navLinkClass}>About</Link>
        </nav>
        <button
          type="button"
          onClick={onToggleDarkMode}
          aria-pressed={darkMode}
          className="font-mono text-xs tracking-wide text-muted hover:text-primary"
        >
          {darkMode ? 'LIGHT MODE' : 'DARK MODE'}
        </button>
      </div>
    </header>
  )
}

export default Navbar
