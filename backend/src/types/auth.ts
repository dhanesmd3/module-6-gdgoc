import { z } from 'zod'

export const RegisterSchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(100),
  email: z.string().trim().toLowerCase().email('email must be a valid email address'),
  password: z
    .string()
    .min(8, 'password must be at least 8 characters')
    .max(72, 'password must be at most 72 characters'), // bcrypt only uses the first 72 bytes
})

export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email('email must be a valid email address'),
  password: z.string().min(1, 'password is required'),
})

// Never includes passwordHash — this is the only user shape sent to clients.
export interface PublicUser {
  id: number
  email: string
  name: string
}
