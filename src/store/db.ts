import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

export type SetType = 'work' | 'warmup'

export type SessionRow = {
  id: string
  startedAt: number
  endedAt: number | null
  dayId: string
  mesoWeek: number
  /** Ausente em sessões anteriores à introdução de múltiplos blocos. */
  blockId?: string
}

export type SetRow = {
  id: string
  sessionId: string
  exerciseId: string
  index: number
  type: SetType
  loadKg: number
  reps: number
  rir: number
  restS: number
  at: number
}

export type CommitmentStatus = 'pending' | 'honored' | 'dropped'

export type CommitmentKind = 'reps' | 'load'

export type CommitmentRow = {
  id: string
  exerciseId: string
  createdAt: number
  targetReps: number
  targetLoadKg: number
  /** Ausente em commitments criados antes da distinção; tratados como 'load'. */
  kind?: CommitmentKind
  status: CommitmentStatus
  resolvedAt: number | null
}

export type SetupRow = { exerciseId: string; text: string; updatedAt: number }

interface NpngDB extends DBSchema {
  sessions: { key: string; value: SessionRow; indexes: { byStartedAt: number } }
  sets: { key: string; value: SetRow; indexes: { bySession: string; byExercise: string } }
  commitments: { key: string; value: CommitmentRow; indexes: { byExercise: string } }
  setups: { key: string; value: SetupRow }
}

let dbPromise: Promise<IDBPDatabase<NpngDB>> | null = null

export function db() {
  if (!dbPromise) {
    dbPromise = openDB<NpngDB>('npng', 1, {
      upgrade(d) {
        const sessions = d.createObjectStore('sessions', { keyPath: 'id' })
        sessions.createIndex('byStartedAt', 'startedAt')
        const sets = d.createObjectStore('sets', { keyPath: 'id' })
        sets.createIndex('bySession', 'sessionId')
        sets.createIndex('byExercise', 'exerciseId')
        const commitments = d.createObjectStore('commitments', { keyPath: 'id' })
        commitments.createIndex('byExercise', 'exerciseId')
        d.createObjectStore('setups', { keyPath: 'exerciseId' })
      },
    })
  }
  return dbPromise
}

export function uid() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

export type Snapshot = {
  sessions: SessionRow[]
  sets: SetRow[]
  commitments: CommitmentRow[]
  setups: SetupRow[]
}

export async function snapshot(): Promise<Snapshot> {
  const d = await db()
  const [sessions, sets, commitments, setups] = await Promise.all([
    d.getAll('sessions'),
    d.getAll('sets'),
    d.getAll('commitments'),
    d.getAll('setups'),
  ])
  return { sessions, sets, commitments, setups }
}

export async function restore(data: Snapshot) {
  const d = await db()
  const tx = d.transaction(['sessions', 'sets', 'commitments', 'setups'], 'readwrite')
  await Promise.all([
    tx.objectStore('sessions').clear(),
    tx.objectStore('sets').clear(),
    tx.objectStore('commitments').clear(),
    tx.objectStore('setups').clear(),
  ])
  for (const row of data.sessions) tx.objectStore('sessions').put(row)
  for (const row of data.sets) tx.objectStore('sets').put(row)
  for (const row of data.commitments) tx.objectStore('commitments').put(row)
  for (const row of data.setups) tx.objectStore('setups').put(row)
  await tx.done
}

export async function wipe() {
  const d = await db()
  const tx = d.transaction(['sessions', 'sets', 'commitments', 'setups'], 'readwrite')
  await Promise.all([
    tx.objectStore('sessions').clear(),
    tx.objectStore('sets').clear(),
    tx.objectStore('commitments').clear(),
    tx.objectStore('setups').clear(),
  ])
  await tx.done
}

export async function startSession(dayId: string, mesoWeek: number, blockId: string): Promise<SessionRow> {
  const row: SessionRow = { id: uid(), startedAt: Date.now(), endedAt: null, dayId, mesoWeek, blockId }
  const d = await db()
  await d.put('sessions', row)
  return row
}

export async function discardSession(sessionId: string) {
  const d = await db()
  const tx = d.transaction(['sessions', 'sets'], 'readwrite')
  for (const row of await tx.objectStore('sets').index('bySession').getAll(sessionId)) {
    tx.objectStore('sets').delete(row.id)
  }
  tx.objectStore('sessions').delete(sessionId)
  await tx.done
}

export async function endSession(sessionId: string) {
  const d = await db()
  const row = await d.get('sessions', sessionId)
  if (!row) return
  await d.put('sessions', { ...row, endedAt: Date.now() })
}

export async function addSet(row: Omit<SetRow, 'id' | 'at'>) {
  const d = await db()
  const full: SetRow = { ...row, id: uid(), at: Date.now() }
  await d.put('sets', full)
  return full
}

export async function removeSet(id: string) {
  const d = await db()
  await d.delete('sets', id)
}

export async function setsOfSession(sessionId: string) {
  const d = await db()
  return (await d.getAllFromIndex('sets', 'bySession', sessionId)).sort((a, b) => a.at - b.at)
}

export async function saveSetup(exerciseId: string, text: string) {
  const d = await db()
  await d.put('setups', { exerciseId, text, updatedAt: Date.now() })
}

export async function addCommitment(
  exerciseId: string,
  targetReps: number,
  targetLoadKg: number,
  kind: CommitmentKind,
) {
  const d = await db()
  const row: CommitmentRow = {
    id: uid(),
    exerciseId,
    createdAt: Date.now(),
    targetReps,
    targetLoadKg,
    kind,
    status: 'pending',
    resolvedAt: null,
  }
  await d.put('commitments', row)
  return row
}

export async function resolveCommitment(id: string, status: Exclude<CommitmentStatus, 'pending'>) {
  const d = await db()
  const row = await d.get('commitments', id)
  if (!row) return
  await d.put('commitments', { ...row, status, resolvedAt: Date.now() })
}
