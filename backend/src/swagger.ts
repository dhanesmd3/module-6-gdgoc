import swaggerJsdoc from 'swagger-jsdoc'

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Portfolio API',
      version: '3.0.0',
      description:
        'REST API for managing portfolio projects, backed by PostgreSQL via Supabase + Drizzle ORM (Module 5), with JWT authentication (Module 6). Write endpoints need "Authorization: Bearer <accessToken>" from /api/auth/login.',
    },
    servers: [{ url: 'http://localhost:4000' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
})
