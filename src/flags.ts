/**
 * Interruptores temporários de teste.
 *
 * Qualquer flag fora do padrão aparece como aviso na tela de Ajustes, para não
 * acabar em produção por esquecimento. Antes de considerar o app pronto,
 * tudo aqui volta ao valor de produção anotado ao lado.
 */

/** produção: true. */
export const FIRST_TIME_NOTICE = true

export const NON_DEFAULT_FLAGS: string[] = [
  ...(FIRST_TIME_NOTICE ? [] : ['Aviso de primeira vez no exercício está DESLIGADO']),
]
