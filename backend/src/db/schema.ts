import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  githubUrl: text('github_url').notNull(),
  liveUrl: text('live_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  // Bonus 3 — soft delete: null means "not deleted"
  deletedAt: timestamp('deleted_at'),
})

// One project has many tech_stack rows (one-to-many).
// projectId is a Foreign Key pointing back to projects.id.
export const techStack = pgTable('tech_stack', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
})

// Relations let Drizzle's query API do the JOIN for us automatically
// (db.query.projects.findMany({ with: { techStack: true } }))
export const projectsRelations = relations(projects, ({ many }) => ({
  techStack: many(techStack),
}))

export const techStackRelations = relations(techStack, ({ one }) => ({
  project: one(projects, {
    fields: [techStack.projectId],
    references: [projects.id],
  }),
}))
