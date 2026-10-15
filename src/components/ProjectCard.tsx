import type { Project } from '../types/project'

/**
 * ProjectCard component menampilkan informasi singkat tentang sebuah project,
 * termasuk judul, deskripsi, teknologi yang digunakan, dan tautan live/demo serta GitHub.
 */
interface ProjectCardProps extends Project {
  /** Tag yang sedang aktif (difilter), digunakan untuk highlight chip teknologi yang sesuai. */
  activeTag?: string
}

function ProjectCard({
  title,
  description,
  techStack,
  liveUrl,
  githubUrl,
  activeTag,
}: ProjectCardProps) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-border bg-surface p-6 transition-transform hover:-translate-y-1 hover:shadow-lg">
      {/* Judul Project */}
      <h3 className="font-display">{title}</h3>
      
      {/* Deskripsi singkat Project */}
      <p className="mt-2 flex-1 text-sm text-muted">{description}</p>

      {/* Teknologi yang digunakan */}
      <ul className="my-3 flex flex-wrap gap-2" aria-label="Technologies used">
        {techStack.map((tech) => {
          const isActive = tech === activeTag
          return (
            <li
              key={tech}
              className={`rounded-full border px-2.5 py-0.5 font-mono text-xs ${
                isActive ? 'border-primary text-primary' : 'border-border text-accent'
              }`}
              aria-current={isActive ? 'true' : undefined}
            >
              {tech}
            </li>
          )
        })}
      </ul>

      {/* Tautan ke Live Demo dan GitHub */}
      <div className="mt-2 flex gap-4 font-mono text-sm">
        {liveUrl && (
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Live Demo
            <span className="sr-only">{` untuk ${title} (akan terbuka di tab baru)`}</span>
          </a>
        )}
        {githubUrl && (
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            GitHub
            <span className="sr-only">{` source code untuk ${title} (akan terbuka di tab baru)`}</span>
          </a>
        )}
      </div>
    </article>
  )
}

export default ProjectCard
