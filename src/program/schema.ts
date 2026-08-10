import { z } from 'zod'

export const MUSCLES = [
  'peitoral',
  'costas',
  'trapezio',
  'lombar',
  'deltoide',
  'biceps',
  'triceps',
  'antebraco',
  'quadriceps',
  'posteriores',
  'gluteos',
  'abdutores',
  'adutores',
  'panturrilha',
  'abdomen',
] as const

export const PATTERNS = ['push_h', 'push_v', 'pull_h', 'pull_v', 'knee', 'hip', 'isolation'] as const

export const CORE_PATTERNS = ['push_h', 'push_v', 'pull_h', 'pull_v', 'knee', 'hip'] as const

export const EXERCISE_CLASSES = [
  'multi_inf_livre',
  'multi_inf_guiado',
  'acess_inf',
  'multi_sup_livre',
  'multi_sup_guiado',
  'acess_sup',
] as const

export const MESO_TYPES = ['tecnica', 'acumulacao', 'intensificacao', 'teste', 'hipertrofia'] as const

export const MESO_RULES = ['rir_ramp', 'sets_ramp', 'load_ramp', 'ondulante'] as const

/** Como ler o número de carga registrado. Fica visível ao lado do stepper. */
export const LOAD_UNITS = ['total', 'por lado', 'por halter'] as const

const idPattern = /^[a-z0-9_]+$/

export const bandSchema = z.object({ min: z.number().int().positive(), max: z.number().int().positive() })

export const mesocycleSchema = z.object({
  id: z.string().regex(/^[a-z0-9_]+$/),
  name: z.string().min(1),
  type: z.enum(MESO_TYPES),
  weeks: z.number().int().min(1).max(12),
  deload_week: z.number().int().min(1).max(13).nullable(),
  rule: z.enum(MESO_RULES),
  intensity_pct: z.number().int().min(50).max(100).optional(),
})

export const exerciseSchema = z.object({
  id: z.string().regex(idPattern),
  name: z.string().min(1),
  photo: z.string().min(1),
  pattern: z.enum(PATTERNS),
  class: z.enum(EXERCISE_CLASSES),
  primary: z.array(z.enum(MUSCLES)).min(1),
  secondary: z.array(z.enum(MUSCLES)).default([]),
  sets: z.number().int().min(1).max(8),
  ramp: z.boolean().default(false),
  reps: z.tuple([z.number().int().min(1), z.number().int().min(1)]),
  rir: z.number().int().min(0).max(5),
  increment: z.number().positive(),
  load_unit: z.enum(LOAD_UNITS).default('total'),
  /** Peso da barra/estrutura, somado uma vez ao converter `por lado` em carga real. */
  bar_kg: z.number().min(0).optional(),
  /** Segundos de montagem por série. Default por classe em engine/duration. */
  setup_s: z.number().int().min(0).optional(),
  rest: z.number().int().min(0),
  failure_ok: z.boolean(),
  seed_kg: z.number().min(0).nullable().default(null),
  warmup_hint: z.boolean().default(false),
  setup_hint: z.string().default(''),
})

export const daySchema = z.object({
  id: z.string().regex(/^[A-Z0-9]+$/),
  name: z.string().min(1),
  exercises: z.array(z.string().regex(idPattern)).min(1),
})

export const blockSchema = mesocycleSchema.extend({
  days: z.array(daySchema).min(1),
})

export const programSchema = z.object({
  muscles: z.partialRecord(z.enum(MUSCLES), bandSchema),
  exercises: z.array(exerciseSchema).min(1),
  blocks: z.array(blockSchema).min(1),
})

export type Band = z.infer<typeof bandSchema>
export type Mesocycle = z.infer<typeof mesocycleSchema>
export type Exercise = z.infer<typeof exerciseSchema>
export type Day = z.infer<typeof daySchema>
export type Block = z.infer<typeof blockSchema>
export type Program = z.infer<typeof programSchema>
export type Muscle = (typeof MUSCLES)[number]
export type Pattern = (typeof PATTERNS)[number]
export type ExerciseClass = (typeof EXERCISE_CLASSES)[number]
