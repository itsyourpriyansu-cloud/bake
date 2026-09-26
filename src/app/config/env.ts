import { z } from 'zod'

const booleanString = (fallback: 'true' | 'false') => z.string().default(fallback).transform((value) => value === 'true')
const schema = z.object({
  VITE_APP_MODE: z.string().default('prototype'),
  VITE_API_BASE: z.string().default('/api/v1'),
  VITE_ENABLE_MSW: booleanString('true'),
  VITE_ENABLE_DEMO_TOOLS: booleanString('false'),
  VITE_PITCH_MODE: booleanString('false'),
  VITE_PWA_SCOPE: z.string().default('/app/'),
})

export const env = schema.parse(import.meta.env)
export const showDemoTools = env.VITE_ENABLE_DEMO_TOOLS && !env.VITE_PITCH_MODE
