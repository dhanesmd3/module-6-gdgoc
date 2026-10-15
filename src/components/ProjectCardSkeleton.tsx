function ProjectCardSkeleton() {
  return (
    <div
      className="animate-pulse rounded-xl border border-border bg-surface p-6"
      aria-hidden="true"
    >
      <div className="h-4 w-1/2 rounded bg-border" />
      <div className="mt-3 h-3 w-full rounded bg-border" />
      <div className="mt-2 h-3 w-5/6 rounded bg-border" />
      <div className="mt-4 flex gap-2">
        <div className="h-5 w-14 rounded-full bg-border" />
        <div className="h-5 w-14 rounded-full bg-border" />
      </div>
    </div>
  )
}

export default ProjectCardSkeleton
