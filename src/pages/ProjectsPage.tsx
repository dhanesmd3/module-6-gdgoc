import { useEffect, useMemo, useState } from 'react'
import ProjectCard from '../components/ProjectCard'
import ProjectCardSkeleton from '../components/ProjectCardSkeleton'
import ProjectFilters from '../components/ProjectFilters'
import ProjectForm from '../components/ProjectForm'
import { useProjectsStore } from '../store/useProjectsStore'
import { useAuthStore } from '../store/useAuthStore'
import type { Project } from '../types/project'

const ALL_FILTER = 'All'

function ProjectsPage() {
  const { projects, loading, error, fetchProjects, addProject, updateProject, removeProject } =
    useProjectsStore()
  const user = useAuthStore((state) => state.user)
  const [activeTag, setActiveTag] = useState<string>(ALL_FILTER)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleDelete(project: Project) {
    if (!window.confirm(`Delete "${project.title}"?`)) return
    setActionError(null)
    try {
      await removeProject(project.id)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete project')
    }
  }

  // Fetch from the backend once when the page mounts.
  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const tags = useMemo(() => {
    const unique = new Set<string>()
    for (const project of projects) {
      for (const tech of project.techStack) unique.add(tech)
    }
    return [ALL_FILTER, ...Array.from(unique).sort((a, b) => a.localeCompare(b))]
  }, [projects])

  const filteredProjects = useMemo(() => {
    if (activeTag === ALL_FILTER) return projects
    return projects.filter((project) => project.techStack.includes(activeTag))
  }, [projects, activeTag])

  return (
    <section className="min-h-[40vh] py-16">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="mb-2 font-display text-2xl">Projects</h2>
        <p className="mb-6 text-sm text-muted">
          A collection of things I&apos;ve built. Filter by a technology to narrow things down.
        </p>

        {/* Only logged-in users can add projects; the backend enforces this too. */}
        {user && !creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="mb-6 rounded-full bg-primaryStrong px-4 py-1.5 font-mono text-xs text-white hover:opacity-90"
          >
            + New project
          </button>
        )}
        {user && creating && (
          <div className="mb-6">
            <ProjectForm
              onSubmit={async (input) => {
                await addProject(input)
                setCreating(false)
              }}
              onCancel={() => setCreating(false)}
            />
          </div>
        )}

        {actionError && (
          <p role="alert" className="mb-4 text-sm text-red-600 dark:text-red-400">{actionError}</p>
        )}

        <ProjectFilters tags={tags} activeTag={activeTag} onSelect={setActiveTag} />

        {loading && (
          <div
            role="status"
            aria-live="polite"
            aria-busy="true"
            className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-5"
          >
            <span className="sr-only">Loading projects…</span>
            <ProjectCardSkeleton />
            <ProjectCardSkeleton />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-16 text-center">
            <h3 className="font-display text-lg">Couldn&apos;t load projects</h3>
            <p className="mt-1 text-sm text-muted">{error}</p>
            <p className="mt-1 text-sm text-muted">
              Make sure the backend server is running at{' '}
              <code className="font-mono">http://localhost:4000</code>.
            </p>
            <button
              type="button"
              onClick={() => fetchProjects()}
              className="mt-4 rounded-full border border-border px-4 py-1.5 font-mono text-xs text-muted hover:text-primary"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && filteredProjects.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface px-6 py-16 text-center">
            <h3 className="font-display text-lg">No projects found</h3>
            <p className="mt-1 max-w-sm text-sm text-muted">
              {`There are no projects tagged with "${activeTag}". Try a different technology.`}
            </p>
            <button
              type="button"
              onClick={() => setActiveTag(ALL_FILTER)}
              className="mt-4 rounded-full border border-border px-4 py-1.5 font-mono text-xs text-muted hover:text-primary"
            >
              Clear filter
            </button>
          </div>
        )}

        {!loading && !error && filteredProjects.length > 0 && (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-5">
            {filteredProjects.map((project) => {
              const isOwner = user !== null && project.ownerId === user.id

              if (isOwner && editingId === project.id) {
                return (
                  <ProjectForm
                    key={project.id}
                    initial={project}
                    onSubmit={async (input) => {
                      await updateProject(project.id, input)
                      setEditingId(null)
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                )
              }

              return (
                <ProjectCard
                  key={project.id}
                  {...project}
                  activeTag={activeTag}
                  onEdit={isOwner ? () => setEditingId(project.id) : undefined}
                  onDelete={isOwner ? () => handleDelete(project) : undefined}
                />
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export default ProjectsPage
