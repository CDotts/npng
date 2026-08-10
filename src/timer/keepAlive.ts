/**
 * Só Wake Lock. O alarme sonoro foi removido — ver DOCTRINE.md §13.5 para o
 * histórico do que foi tentado e por que nenhuma combinação funcionou no iOS.
 * O aviso de fim de descanso é a notificação (src/timer/notify.ts).
 */

let wakeLock: WakeLockSentinel | null = null

export async function startKeepAlive() {
  await requestWakeLock()
}

export function stopKeepAlive() {
  void wakeLock?.release().catch(() => {})
  wakeLock = null
}

async function requestWakeLock() {
  if (!('wakeLock' in navigator)) return
  try {
    wakeLock = await navigator.wakeLock.request('screen')
    wakeLock.addEventListener('release', () => {
      wakeLock = null
    })
  } catch {
    // Sem wake lock a tela apaga sozinha e o iOS suspende a página.
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && !wakeLock) void requestWakeLock()
})

export function screenLockHeld() {
  return !!wakeLock
}
