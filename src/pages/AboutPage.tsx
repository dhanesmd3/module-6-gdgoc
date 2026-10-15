interface PlanItem {
  tag: string
  title: string
  description: string
}

const plans: PlanItem[] = [
  { tag: '01', title: 'HTML5', description: 'Structuring content the right way, with semantics that matter.' },
  { tag: '02', title: 'CSS3', description: 'Box model, Flexbox, and Grid.' },
  { tag: '03', title: 'JavaScript', description: 'Making pages respond, fetch data, and come alive.' },
  { tag: '04', title: 'Git & GitHub', description: 'Tracking progress, one meaningful commit at a time.' },
  { tag: '05', title: 'React', description: 'Currently learning: components, state, and building real apps.' },
]

function AboutPage() {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="mb-8 font-display text-2xl">What I want to learn?</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-5">
          {plans.map((plan) => (
            <article
              key={plan.tag}
              className="rounded-xl border border-border bg-surface p-6 transition-transform hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="font-mono text-sm text-accent">{plan.tag}</span>
              <h3 className="my-2 font-display">{plan.title}</h3>
              <p className="text-sm text-muted">{plan.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default AboutPage
