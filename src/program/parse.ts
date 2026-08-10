import { parse as parseYaml } from 'yaml'
import { programSchema, type Program } from './schema'
import { lint, type Finding } from './lint'

export type ParseResult =
  | { ok: true; program: Program; findings: Finding[] }
  | { ok: false; findings: Finding[] }

export function parseProgram(source: string): ParseResult {
  let raw: unknown
  try {
    raw = parseYaml(source)
  } catch (err) {
    return {
      ok: false,
      findings: [{ severity: 'error', rule: 'yaml-syntax', message: (err as Error).message }],
    }
  }

  const parsed = programSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      findings: parsed.error.issues.map((issue) => ({
        severity: 'error' as const,
        rule: 'schema',
        message: `${issue.path.join('.') || '(raiz)'}: ${issue.message}`,
      })),
    }
  }

  const findings = lint(parsed.data)
  if (findings.some((f) => f.severity === 'error')) {
    return { ok: false, findings }
  }
  return { ok: true, program: parsed.data, findings }
}
