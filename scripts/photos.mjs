import { readdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const files = readdirSync(resolve(root, 'public/ex'))
  .filter((f) => f.endsWith('.jpg'))
  .sort()

const body = `export const PHOTOS = [
${files.map((f) => `  'ex/${f}',`).join('\n')}
] as const
`

writeFileSync(resolve(root, 'src/program/photos.generated.ts'), body)
console.log(`photos.generated.ts: ${files.length} fotos`)
