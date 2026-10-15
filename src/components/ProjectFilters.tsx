interface ProjectFiltersProps {
  tags: string[]
  activeTag: string
  onSelect: (tag: string) => void
}

function ProjectFilters({ tags, activeTag, onSelect }: ProjectFiltersProps) {
  return (
    <nav aria-label="Filter projects by technology" className="mb-6">
      <ul className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const isActive = tag === activeTag
          return (
            <li key={tag}>
              <button
                type="button"
                aria-pressed={isActive}
                onClick={() => onSelect(tag)}
                className={`rounded-full border px-3 py-1 font-mono text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  isActive
                    ? 'border-primaryStrong bg-primaryStrong text-white'
                    : 'border-border text-muted hover:text-primary'
                }`}
              >
                {tag}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default ProjectFilters
