import swaggerJsdoc from 'swagger-jsdoc'

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Portfolio API',
      version: '2.0.0',
      description: 'REST API for managing portfolio projects, now backed by PostgreSQL via Supabase + Drizzle ORM (Module 5).',
    },
    servers: [{ url: 'http://localhost:4000' }],
  },
  apis: ['./src/routes/*.ts'],
})
