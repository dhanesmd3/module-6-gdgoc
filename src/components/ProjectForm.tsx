import { useState, type FormEvent } from 'react'
import type { Project, ProjectInput } from '../types/project'

interface ProjectFormProps {
  /** When set, the form edits this project; otherwise it creates a new one. */
  initial?: Project
  onSubmit: (input: ProjectInput) => Promise<void>
  onCancel: () => void
}

const inputClass =
  'w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'

function ProjectForm({ initial, onSubmit, onCancel }: ProjectFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [techStack, setTechStack] = useState(initial?.techStack.join(', ') ?? '')
  const [githubUrl, setGithubUrl] = useState(initial?.githubUrl ?? '')
  const [liveUrl, setLiveUrl] = useState(initial?.liveUrl ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const idPrefix = initial ? `edit-${initial.id}` : 'new'

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        techStack: techStack.split(',').map((t) => t.trim()).filter(Boolean),
        githubUrl: githubUrl.trim(),
        liveUrl: liveUrl.trim() || undefined,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-xl border border-primary bg-surface p-6"
      aria-label={initial ? `Edit ${initial.title}` : 'New project'}
    >
      <h3 className="font-display">{initial ? 'Edit project' : 'New project'}</h3>
      <div>
        <label htmlFor={`${idPrefix}-title`} className="mb-1 block text-xs font-medium">Title</label>
        <input id={`${idPrefix}-title`} className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-description`} className="mb-1 block text-xs font-medium">Description</label>
        <textarea
          id={`${idPrefix}-description`}
          className={inputClass}
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-tech`} className="mb-1 block text-xs font-medium">Tech stack (comma separated)</label>
        <input id={`${idPrefix}-tech`} className={inputClass} value={techStack} onChange={(e) => setTechStack(e.target.value)} placeholder="React, TypeScript" />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-github`} className="mb-1 block text-xs font-medium">GitHub URL</label>
        <input id={`${idPrefix}-github`} type="url" className={inputClass} value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-live`} className="mb-1 block text-xs font-medium">Live URL (optional)</label>
        <input id={`${idPrefix}-live`} type="url" className={inputClass} value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-primaryStrong px-4 py-1.5 font-mono text-xs text-white hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-border px-4 py-1.5 font-mono text-xs text-muted hover:text-primary"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default ProjectForm
