/**
 * O iOS não expõe agendamento de notificação local: só dá para mostrar uma
 * agora, com a página viva. Serve como aviso redundante ao bipe — e é o único
 * canal que aparece com o telefone no silencioso.
 */
export function notifyState() {
  if (!('Notification' in window)) return 'indisponível' as const
  return Notification.permission
}

export async function requestNotify() {
  if (!('Notification' in window)) return 'indisponível' as const
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied' as const
  }
}

export async function notifyRestDone(exercise: string, nextSet: number) {
  if (notifyState() !== 'granted') return false
  try {
    const reg = await navigator.serviceWorker.getRegistration()
    const body = `${exercise} — série ${nextSet}`
    if (reg) {
      await reg.showNotification('Descanso terminado', {
        body,
        tag: 'npng-rest',
        renotify: true,
        icon: `${import.meta.env.BASE_URL}icon-192.png`,
        badge: `${import.meta.env.BASE_URL}icon-192.png`,
      } as NotificationOptions)
      return true
    }
    new Notification('Descanso terminado', { body, tag: 'npng-rest' })
    return true
  } catch {
    return false
  }
}
