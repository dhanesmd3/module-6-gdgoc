import { Link } from 'react-router-dom'

function HomePage() {
  return (
    <section className="animate-fadeIn py-16">
      <div className="mx-auto max-w-3xl px-6">
        <p className="mb-4 font-mono text-xs tracking-wide text-muted">
          STUDENT ENGINEER - BUILDING MY FIRST WEBSITE
        </p>
        <h1 className="mb-3 font-display text-4xl font-bold sm:text-5xl">
          Dhanesworo Muhammad Datiputro
          <span className="animate-blink text-primary">_</span>
        </h1>
        <p className="mb-5 font-mono text-primary">Informatics Student, ITB · Class of 2025</p>
        <p className="max-w-xl text-muted">
          19-year-old Informatics student learning how the web actually works,
          from the DOM to deployment. This portfolio is now a React +
          TypeScript app styled with TailwindCSS, my second checkpoint in that
          journey.
        </p>
        <p className="mt-5 font-mono text-sm">
          <Link to="/projects" className="text-primary hover:underline">
            See my projects
          </Link>
          {' · '}
          <Link to="/about" className="text-primary hover:underline">
            More about me
          </Link>
        </p>
      </div>
    </section>
  )
}

export default HomePage
