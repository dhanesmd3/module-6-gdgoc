import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Module 6 — users who can log in and own projects.
// passwordHash is a bcrypt hash, never the plaintext password. It is null for
// accounts created through "Login with GitHub" (Bonus 1), which have githubId.
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash'),
  githubId: text('github_id').unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Module 6 Bonus 2 — refresh tokens. We only store a SHA-256 hash of the
// token, so a leaked database dump can't be used to mint new sessions.
export const refreshTokens = pgTable('refresh_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  revokedAt: timestamp('revoked_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  githubUrl: text('github_url').notNull(),
  liveUrl: text('live_url'),
  // Module 6 — the user who created this project. Only they can edit/delete it.
  // Nullable so projects created before Module 6 keep working (they just
  // have no owner, so nobody can modify them through the API).
  ownerId: integer('owner_id').references(() => users.id, { onDelete: 'set null' }),
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
export const projectsRelations = relations(projects, ({ many, one }) => ({
  techStack: many(techStack),
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
  }),
}))

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
}))

export const techStackRelations = relations(techStack, ({ one }) => ({
  project: one(projects, {
    fields: [techStack.projectId],
    references: [projects.id],
  }),
}))
