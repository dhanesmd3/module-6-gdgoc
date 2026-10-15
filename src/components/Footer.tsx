function Footer() {
  return (
    <footer className="mt-8 border-t border-border py-12">
      <div className="mx-auto max-w-3xl px-6">
        <p className="mb-4 font-mono text-primary">$ contact --dhanesworo</p>
        <ul className="mb-5 flex flex-wrap gap-5 font-mono text-sm">
          <li>
            <a href="mailto:dhanesworo.md@gmail.com" className="hover:text-primary">
              email: dhanesworo.md@gmail.com
            </a>
          </li>
          <li>
            <a href="https://github.com/dhanesmd3" target="_blank" rel="noopener" className="hover:text-primary">
              github.com/dhanesmd3
            </a>
          </li>
          <li>
            <a
              href="https://www.linkedin.com/in/dhanesworo-muhammad-datiputro/"
              target="_blank"
              rel="noopener"
              className="hover:text-primary"
            >
              linkedin.com/in/dhanesworo-muhammad-datiputro
            </a>
          </li>
        </ul>
        <p className="text-sm text-muted">&copy; 2026 Dhanesworo. Built with React &amp; TypeScript.</p>
      </div>
    </footer>
  )
}

export default Footer
