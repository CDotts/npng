import { Accordion } from './Accordion'

const TERMS: { term: string; body: string }[] = [
  {
    term: 'RIR',
    body: 'Reps in reserve: quantas repetições ainda sobravam quando você encerrou a série. RIR 2 significa que daria para fazer mais duas. É o jeito de medir esforço sem depender de ir à falha.',
  },
  {
    term: 'RPE',
    body: 'A mesma escala pelo outro lado: RPE = 10 − RIR. RPE 8 é RIR 2. O app usa RIR porque é mais direto de responder logo após a série.',
  },
  {
    term: 'Série efetiva',
    body: 'Série levada perto o suficiente da falha para gerar estímulo. O estímulo mora nas últimas repetições, quando a velocidade cai e o recrutamento é máximo. Reps confortáveis no começo são custo, não estímulo.',
  },
  {
    term: 'Volume lixo',
    body: 'Série a RIR 4 ou mais: gera fadiga sem adaptação proporcional. O app desconta essas séries do contador, por isso o número na tela de Volume pode ser menor que o de séries executadas.',
  },
  {
    term: 'Banda de volume',
    body: 'A dose semanal produtiva de um grupo muscular. Grupos grandes ~10-14 séries por semana, pequenos ~6-10. Abaixo o estímulo é insuficiente; acima, o retorno cai e a fadiga sobe.',
  },
  {
    term: 'Direto vs. indireto',
    body: 'Direto é quando o grupo é o primário do exercício. Indireto é o que ele leva de carona (tríceps no supino, bíceps na remada), contado a meia série. A banda vale para as diretas — senão o indireto de um programa com muitos compostos estoura sozinho a banda de todo grupo pequeno.',
  },
  {
    term: 'Top set',
    body: 'A melhor série do exercício naquele treino. É o critério de progressão: as séries seguintes caem por fadiga acumulada, então exigir o teto em todas travaria a progressão.',
  },
  {
    term: 'Dupla progressão',
    body: 'Prescreve-se uma faixa de reps, não um número. Você sobe de rep em rep dentro da faixa com a mesma carga; ao fechar o teto, reseta para o piso e sobe a carga. É por isso que a linha de carga fica parada enquanto a de reps sobe.',
  },
  {
    term: 'Commitment',
    body: 'A intenção declarada de subir na próxima vez. Sem commitment aceito, a prescrição apenas repete o último treino — nada avança sozinho. Não altera a carga atual, que continua derivando do log. Pode ser honrado, adiado (segue pendente e reaparece) ou descartado.',
  },
  {
    term: 'Mesociclo',
    body: 'Um bloco de ~4 semanas com um objetivo só. A sequência: técnica, acumulação, intensificação, teste, hipertrofia ondulante. O bloco atual é de acumulação.',
  },
  {
    term: 'Acumulação',
    body: 'Bloco em que o volume sobe semana a semana com a intensidade estável. Começa abaixo da banda por desenho e a alcança no pico — daí a tela de Volume indicar valores abaixo da banda nas primeiras semanas.',
  },
  {
    term: 'Deload',
    body: 'Semana a ~50% do volume do pico, com as mesmas cargas, ao fim da acumulação. O app não propõe progressão nem oferece commitments pendentes durante o deload — a sessão é mais leve por desenho, então não serve de base para subir carga. A adaptação se expressa na recuperação: o estímulo acumulado se converte em resultado enquanto a fadiga cai. Faz parte do bloco, não é etapa opcional.',
  },
  {
    term: 'Falha mecânica vs. técnica',
    body: 'Mecânica é não conseguir mover a carga — evitada em multiarticulares livres, onde o custo de recuperação e o risco são altos. Técnica é a execução degradar — aceitável, e útil, em máquinas e isoladores, principalmente na última série.',
  },
  {
    term: 'Padrões de movimento',
    body: 'Empurrar horizontal, empurrar vertical, puxar horizontal, puxar vertical, dominante de joelho, dominante de quadril. Um programa que cobre os seis cobre o corpo, e o lint acusa padrão com frequência abaixo de 2.',
  },
  {
    term: 'Frequência 2',
    body: 'Cada grupo treinado duas vezes por semana. A síntese proteica após um treino dura ~48h, então frequência 1 desperdiça metade da janela semanal.',
  },
  {
    term: 'Sobrecarga progressiva',
    body: 'A via principal do atleta natural: sem aumento de carga ou reps ao longo do tempo não há adaptação. Implica manter os exercícios básicos estáveis — não há progressão mensurável no que não se repete.',
  },
]

export function Glossario() {
  return (
    <div className="app">
      <div className="top">
        <h1>Glossário</h1>
        <span className="muted small mono">{TERMS.length} termos</span>
      </div>

      <div className="notice info">
        Terminologia da <b>Escola dos Naturais</b>, de Jayme de Lamadrid — a metodologia que este app
        implementa. São termos da doutrina, não convenções do app.
      </div>

      {TERMS.map((t) => (
        <Accordion key={t.term} title={t.term}>
          <p className="muted small" style={{ margin: '8px 0 0' }}>
            {t.body}
          </p>
        </Accordion>
      ))}
    </div>
  )
}
