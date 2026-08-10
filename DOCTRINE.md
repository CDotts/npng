# Doutrina de Treino — Escola dos Naturais (EDN)

> **Para agentes futuros:** este arquivo é a razão de ser do app. `PLAN.md` diz *como* o software é
> construído; este diz *por que o treino é assim*. Se você for otimizar, refatorar ou "melhorar" a
> lógica de treino, leia isto primeiro. Várias decisões que parecem arbitrárias no código são
> restrições doutrinárias deliberadas. A seção final lista o que **não** pode ser mexido sem
> autorização explícita do Caio.

Metodologia de **Jayme de Lamadrid**, da Escola dos Naturais. Resumo operacional escrito a partir do
ebook (106 p.) e dos materiais complementares — Frequência, Divisão de Treino, A Escolha dos
Exercícios, Tipo de Séries, Periodização, Planilha de Treino.

---

## 1. Premissa

O método é escrito para o **atleta natural** — sem esteroides. A distinção não é ideológica, é
fisiológica: o usuário de anabolizantes recupera mais rápido e tolera muito mais volume. Copiar a
rotina de um fisiculturista profissional é a causa raiz da maioria dos platôs de quem treina limpo.

Consequência prática: **volume é um remédio com dose ótima, não "quanto mais melhor"**. Passar da
dose não acelera nada — atrasa, porque compromete a recuperação e portanto a sessão seguinte.

## 2. Os três pilares

Toda decisão do programa se resolve em um destes três, nesta ordem de importância:

1. **Sobrecarga progressiva** — a via principal do natural. Sem aumento de carga/reps ao longo do
   tempo não existe adaptação, por mais bem desenhado que o resto esteja.
2. **Intensidade de esforço** — proximidade da falha. Série longe da falha não estimula.
3. **Volume** — número de séries efetivas por semana, dentro de uma faixa, não maximizado.

## 3. Volume

**O que o livro diz** (p.17): a recomendação **inicial** é de cerca de **12 séries semanais para os
grupos grandes** e **8 para os pequenos**, números que "podem variar dependendo das circunstâncias
individuais e do progresso ao longo do tempo". Antes disso (p.15) ele cita que **80% do resultado
hipertrófico sai de 5 a 9 séries semanais**, e resume: *naturais geralmente obtêm melhores
resultados treinando menos*.

**O que este app usa** — operacionalização nossa, não número do livro: uma **banda** em torno da
referência, porque o app precisa de um intervalo para acusar "abaixo" e "acima".

| Grupo | Banda usada | Referência do livro |
|---|---|---|
| Grandes (peito, costas, quadríceps, posteriores) | 10–14 | ~12 |
| Pequenos (bíceps, tríceps, ombros, panturrilha) | 6–10 | ~8 |

> **Atenção ao teto.** O máximo de 14 fica **acima** da recomendação inicial do livro. Isso foi
> escolha de projeto, não da fonte. Um bloco que encoste em 14 num grupo está no limite superior do
> que a metodologia sugere para quem está começando — e o próprio livro trata o excesso de volume
> como o erro mais comum do natural. Ao rever as bandas, o viés deve ser para baixo, não para cima.

**Direto vs. indireto.** A banda é medida em **séries diretas** — aquelas em que o grupo é o
primário do exercício. O trabalho indireto (tríceps no supino, bíceps na remada) é contabilizado a
meia série e **mostrado**, mas não entra na checagem da banda. Sem essa separação, o volume indireto
de um programa com muitos compostos estoura sozinho a banda de todo grupo pequeno e torna qualquer
trabalho direto impossível — o que não é o que a doutrina quer dizer.

**Volume lixo** é o conceito central. Uma série só conta se foi *efetiva* — próxima o suficiente da
falha para gerar estímulo. Uma série a RIR 4 ou mais não é meio estímulo: é fadiga sem adaptação.
Ela custa recuperação e não paga nada.

> No app: séries logadas com RIR ≥ 4 são **descontadas** do contador semanal. O número que a tela de
> Volume mostra é de séries *efetivas*, não de séries executadas. Isso é intencional e não é bug.

Se o volume prescrito passa de 10–12 séries num grupo, ele precisa ser **dividido em duas sessões**
na semana — daí a frequência 2.

## 4. Intensidade e as "reps válidas"

O estímulo hipertrófico mora nas **últimas repetições** de uma série, aquelas em que a velocidade cai
e o recrutamento de unidades motoras é máximo. Reps confortáveis no começo da série são custo, não
estímulo.

**RIR** (Reps In Reserve) = quantas repetições você ainda conseguiria fazer. **RPE** = 10 − RIR.

| RPE | RIR | Leitura |
|---|---|---|
| 10 | 0 | falha concêntrica |
| 9 | 1 | mais uma rep possível |
| 8 | 2 | mais duas |
| 7 | 3 | mais três |
| ≤6 | ≥4 | volume lixo |

**Faixas alvo por classe de exercício** (da Planilha de Treino — viram default no YAML):

| Classe | Reps | RPE |
|---|---|---|
| Multiarticular inferior livre (agachamento, terra) | 3–8 | 6–8 |
| Multiarticular inferior guiado (leg press, hack) | 6–12 | 6–9 |
| Acessório inferior (extensora, flexora, panturrilha) | 8–20 | 7–10 |
| Multiarticular superior livre (supino, remada, desenvolvimento) | 3–12 | 6–9 |
| Multiarticular superior guiado (chest press, puxada) | 6–15 | 6–10 |
| Acessório superior (crucifixo, rosca, tríceps) | 8–20 | 7–10 |

Note o padrão: **quanto mais livre e mais articulações envolvidas, MENOR o RPE alvo**. Não é
timidez — é gestão de risco e de fadiga sistêmica.

### Falha: dois tipos, dois tratamentos

- **Falha mecânica** (não consegue mover a carga): evitar em multiarticulares livres. O custo de
  recuperação é alto e o risco técnico é real com barra nas costas ou sobre o peito.
- **Falha técnica** (a execução degrada): aceitável, e útil, em máquinas e isoladores, sobretudo na
  última série do exercício.

> No app: cada exercício carrega `failure_ok: true|false`. Agachamento, terra e supino livre são
> `false`; cadeira flexora, extensora e crucifixo são `true`.

## 5. Sobrecarga progressiva

Ordem de preferência dos métodos:

1. **Mais carga** com as mesmas reps — o mais direto.
2. **Mais reps** com a mesma carga — a base da dupla progressão.
3. **Mais séries** — usado na fase de acumulação, dentro do teto de volume.
4. **Melhor execução / mais amplitude** — progressão real, invisível na planilha.
5. Menos descanso, cadência mais lenta, técnicas avançadas — recursos secundários.

### Dupla progressão (o motor do app)

Prescreve-se uma *faixa* de reps, não um número. Sobe-se de reps dentro da faixa até o teto; ao
bater o teto, **reseta para o piso e sobe a carga**.

```
faixa 8–12 @ 60kg
  sessão 1: 4×8   → 4×9  → 4×10 → 4×11 → 4×12
  sessão 6: bateu o teto ⇒ 4×8 @ 62,5kg
```

O teto de reps **é por classe de exercício**, não um número único — vem da tabela da Planilha de
Treino reproduzida acima: 3–8 no multiarticular inferior livre, 8–20 nos acessórios. O lint acusa
faixa declarada fora da classe.

**A progressão é julgada pela top set** — a melhor série do exercício — e só é concedida se o
**alvo de RIR foi cumprido**. Bater 12 reps a RIR 4 não é progresso: é evidência de que a carga
estava leve. Isso é a diferença entre este app e um contador de reps qualquer.

### O caso "leve": reps cumpridas com folga

Bater as reps previstas com RIR **acima** do alvo não é progresso e também não é estagnação — é
evidência de que **a carga estava leve**. A resposta doutrinária é subir carga, não segurar. O
material da EDN classifica isso explicitamente: *teto de reps batido com RIR ≥ 3 → carga errada,
suba carga direto*.

> No app: a subida escala com a folga — cada ponto de RIR sobrando vale **~3% da carga** (heurística
> das tabelas RPE), arredondado para o incremento do exercício, com piso de um incremento. O
> percentual é deliberado: `increment` é a granularidade da anilha, não uma medida de intensidade
> relativa — 10 kg no leg press de 150 não é o mesmo estímulo que 10 kg no stiff de 30. Se a top set
> já estava no teto da faixa, as reps voltam ao piso; se estava no meio, as reps previstas se mantêm
> e só a carga sobe. A proposta continua sendo um commitment: você aceita ou descarta.

> No app: a proposta de subida olha **a top set** — a melhor série do exercício — e exige que ela
> tenha fechado o topo da faixa **com RIR ≤ alvo**. As séries seguintes caem por fadiga acumulada;
> exigir o teto em todas travaria a progressão sem motivo doutrinário. Séries de apoio a RIR 4+ não
> bloqueiam a subida, mas são reportadas e continuam descontadas do volume efetivo. A proposta nunca
> é aplicada sozinha — você aceita ou descarta.

### Quando aumentar o volume (fluxograma da EDN)

O material traz um fluxograma explícito, e ele é o portão para qualquer aumento de volume:
estagnado? → sono, superávit calórico, progressão de carga e técnica estão de pé? → a recuperação
está boa? Só então aumenta. Se a recuperação está ruim, a resposta é **diminuir** o volume, porque
provavelmente está acima do volume máximo recuperável. Está transcrito na skill `proximo-bloco`,
passo 5.

## 6. Frequência

**A frequência não é variável primária.** O livro é explícito: ela *"sucede ao volume e a
intensidade"* e é *"menos relevante"* que os dois. Ela existe para **distribuir** um volume já
decidido, não para justificá-lo.

O que o autor faz na prática: *"costumo deixar em frequência 2, ou seja, divido o volume em dois
treinos por microciclo **quando são envolvidos grupos musculares grandes**, como membros inferiores
e costas"* — e, em avançados, nos grupos atrasados. Não é uma regra universal para todo grupo.

A razão é fadiga e recuperação, não uma janela de tempo: para um natural, volume diário excessivo
impede rendimento linear dentro da sessão e alonga a recuperação. Dividir permite *"parar o treino
no auge"*.

> No app: um lint avisa quando um **padrão de movimento** aparece em menos de 2 dias. Isso é
> **escolha nossa**, mais estrita que a fonte — serve para não esquecer uma direção inteira do corpo
> ao montar o bloco. Um aviso desses não é violação da doutrina; é um lembrete de projeto.

## 7. Escolha dos exercícios

- **Pense em padrões de movimento, não em músculos.** Empurrar horizontal, empurrar vertical, puxar
  horizontal, puxar vertical, dominante de joelho, dominante de quadril. Um programa que cobre os
  seis padrões cobre o corpo.
- **Não encadeie dois exercícios do mesmo grupo primário.** A fadiga do primeiro limita o segundo e
  transforma o segundo em volume lixo.
- **Um básico livre por padrão, cedo na sessão**, quando você está fresco. Acessórios e máquinas
  depois, quando fadiga sistêmica já não permite carga máxima com segurança.
- **Não fique trocando os exercícios básicos.** Variar por variar impede a progressão de carga — que
  é o pilar nº 1. Você não consegue progredir no que não repete. Varie acessórios, não a base.
- **Máquina não é inferior a peso livre.** Máquinas oferecem estabilidade, perfil de resistência
  favorável e permitem chegar perto da falha com segurança. Peso livre oferece carga absoluta e
  transferência. Use os dois pelo que cada um faz melhor.

> No app: cada exercício declara `pattern`. Um lint avisa quando dois exercícios consecutivos
> compartilham o músculo primário, e quando um grupo passa de 12 séries numa única sessão.

## 8. Divisão de treino

Escolha em função dos dias disponíveis, não do que é "melhor" no abstrato:

| Dias | Divisão |
|---|---|
| 3 | Full-body A/B/C em rotação (A-B-A / B-A-B) |
| 4 | **Superior / Inferior / Superior / Inferior** ← o nosso |
| 5 | Híbrido push-pull-legs + superior/inferior |

O critério é sempre o mesmo: cada padrão de movimento precisa ser tocado ~2× na semana, e o volume
semanal por grupo tem que caber nas faixas da seção 3.

## 9. Periodização

Blocos (mesociclos) de ~4 semanas, cada um com um objetivo distinto:

| Meso | Nome | O que muda semana a semana |
|---|---|---|
| 1 | Técnica | Carga estável, RIR desce 4-5 → 3-4 → 2-3 → 1-2 |
| 2–3 | **Acumulação** | Séries sobem (3→4→5→6), intensidade fixa ~80% |
| 4–5 | Intensificação | Reps caem, carga sobe, RPE sobe |
| 6 | Teste | Buscar novas máximas |
| 7 | Hipertrofia ondulante | Faixas variadas na mesma semana |

**Deload:** ao fim de um bloco de acumulação, uma semana a ~50% do volume. Não é opcional e não é
preguiça — é onde a adaptação acontece.

**Bloco atual: Meso 2 — acumulação.** Escolhido porque o Caio está retomando após um período
irregular (15 sessões no ano, plano anterior expirado), mas com técnica já estabelecida nos básicos.

> No app: o mesociclo é declarado por **regra**, não por tabela escrita à mão. O YAML diz
> `rule: sets_ramp`, `weeks: 4`, `deload_week: 5`; o app deriva a prescrição de cada semana a partir
> da regra e do seu histórico. O contador de semana avança por sessão concluída, então pular uma
> semana não dessincroniza o bloco.

## 10. Aquecimento

Primeiro exercício do dia: rampa de ~4 séries a 50 / 70 / 80 / 90% da carga de trabalho. Antes de
multiarticulares pesados: 2 aquecimentos + 2 feeders.

**Aquecimento não é volume.** Não conta para a contagem semanal, nunca.

> No app: mostrado como lembrete de texto no primeiro exercício. Decisão explícita do Caio de não
> logar aquecimento — se um agente futuro quiser gerar e logar a rampa automaticamente, isso é uma
> mudança de escopo, não uma melhoria óbvia. Pergunte antes.

## 11. Descanso

2–4 min em multiarticulares, menos em isoladores. Variável menor: descansar pouco demais compromete
a carga da série seguinte, que é o que importa. Na dúvida, descanse mais.

## 12. Cardio

Ferramenta de gasto calórico e saúde cardiovascular, não de hipertrofia. Não entra no `training.yaml`
nem na contagem de volume. Os equipamentos de cardio estão catalogados em `EQUIPMENT.md` só por
completude.

## 13. O que a doutrina rejeita

- "Confundir o músculo" com variação constante de exercícios — impede a progressão de carga.
- Perseguir dor muscular tardia como métrica de qualidade do treino.
- Bro-split para naturais.
- Volume máximo tolerável como alvo.
- Falha em toda série, em todo exercício.
- Treinar sem registrar. Sem log não há progressão verificável, só sensação.

---

## 13.4 Convenção de carga registrada

Definida pelo Caio em 2026-08-11, vale para todo o app:

- **Barra:** anota o peso das **anilhas de cada lado**, não o total. Motivo prático: a barra muitas
  vezes não tem peso conhecido, e o que ele consegue observar é a anilha.
- **Halter:** anota o peso de **cada halter**, não a soma dos dois.
- **Máquina e polia:** o número do pino, que já é o total.

Cada exercício declara isso em `load_unit` (`total` | `por lado` | `por halter`) e, quando é
`por lado`, também em `bar_kg` — o peso da estrutura, somado **uma vez**. A conversão vive em
`src/engine/load.ts`:

```
por lado    → observado × 2 + bar_kg
por halter  → observado × 2
total       → observado
```

**O número observado é o dado.** Ele é o que se grava, o que se mostra no stepper, o que a
progressão compara e o que sai na coluna `load_kg` do CSV. Nada é migrado quando a convenção muda:
a conversão é aplicada na leitura. A carga real aparece só onde precisa ser somada entre exercícios
diferentes — tonelagem — e como coluna extra `load_real_kg` no CSV.

Por que separar assim: a progressão compara o exercício consigo mesmo, e aí o número observado é
suficiente e é o único que o atleta consegue conferir no aparelho. A tonelagem soma exercícios
distintos, e aí somar 11 (por lado) com 100 (pino de leg press) não significa nada.

**Os `seed_kg` de barra já eram por lado.** Isso foi verificado, não assumido: o desenvolvimento
militar foi executado com 11 kg de cada lado (42 kg reais, confirmado pelo Caio). O supino do mesmo
treino foi registrado como 28,5. Se 28,5 fosse total, o supino seria mais leve que o desenvolvimento
acima da cabeça, o que é fisicamente impossível — logo 28,5 é por lado (77 kg reais). O mesmo
argumento vale para o agachamento: 55 por lado dá 130 kg reais, coerente com esse supino; 55 total
daria um agachamento mais leve que o supino. **Conclusão: o Caio sempre registrou anilha por lado,
e a convenção formalizou um hábito que já existia.** Nenhum dado foi migrado e nenhum seed foi
convertido. A única exceção é o seed do desenvolvimento, que tinha vindo de um número de halter
(26 kg em cada mão, outro exercício) e foi trocado pelo 11 medido em campo.

**Dados anteriores à convenção:** nenhum precisa de correção — ver o parágrafo acima. O log de
2026-08-11 já está na convenção nova.

## 13.5 Áudio no iOS — tentado, descartado, não repetir

O aviso de fim de descanso é uma **notificação**, não um som. Alarme sonoro foi **removido** depois
de esgotar as alternativas em aparelho real (iOS, agosto de 2026). Registrado aqui para ninguém
reabrir a caixa achando que é fácil.

O nó: **manter áudio tocando é a única forma de a página sobreviver à tela bloqueada** no iOS — e é
exatamente isso que toma a sessão de áudio do app de música, sem devolver.

O que foi testado, em ordem, e o que aconteceu:

| Tentativa | Resultado |
|---|---|
| `<audio>` com troca de `src` para o bipe | Mudo. Trocar `src` exige nova ativação por gesto, e o alarme dispara de um timer |
| `<audio>` em loop silencioso + bipe pelo `AudioContext` | Alarme toca com a tela bloqueada, mas o Spotify para no início do treino e não volta |
| `audioSession = 'ambient'` (sem elemento de mídia) | Não interrompe a música, mas **é silenciada pela chave de silencioso** — mudo na prática |
| `audioSession = 'transient-solo'` trocada no instante do bipe | Mudo nos dois modos: trocar categoria com áudio em curso interrompe a sessão e derruba a saída do `AudioContext` |
| `audioSession = 'transient-solo'` definida uma vez, no gesto inicial | Pausou o Spotify sem devolver **e** não emitiu som. Na prática se comportou como `playback` |

Fatos do aparelho, confirmados por diagnóstico em tela: `navigator.audioSession` **existe**;
`navigator.vibrate` **não existe** (sem fallback tátil); Wake Lock funciona com o app em primeiro
plano e cai quando a tela apaga.

Consequência aceita: **o timer exige a tela acesa.** O Wake Lock cobre isso enquanto o app está
aberto. Se a tela apagar, a página é suspensa e o descanso vence sem aviso — ao voltar, o app
notifica com o atraso real em vez de fingir que nada aconteceu.

## 14. Restrições individuais

Este documento descreve o **método**. Os limites de **quem treina** vivem em
[RESTRICTIONS.md](RESTRICTIONS.md) — lesões, incômodos, adaptações em curso e o que não deve ser
reintroduzido.

**Leia os dois antes de montar ou ajustar qualquer treino.** Onde conflitarem, o `RESTRICTIONS.md`
vence: a doutrina é geral, a lesão é específica.

## 15. Contrato com o código

O que o app implementa e **não deve ser alterado sem autorização explícita do Caio**:

| Invariante | Onde vive |
|---|---|
| Bandas de volume semanal por grupo, com semáforo | `engine/volume` + `muscles:` no YAML |
| Séries com RIR ≥ 4 descontadas do volume efetivo | `engine/volume` |
| Dupla progressão com teto de reps e reset ao piso | `engine/progression` |
| Progressão julgada pela top set: topo da faixa **E** RIR ≤ alvo | `engine/progression` |
| Proposta de progressão nunca aplicada automaticamente | runner, ao fechar o exercício |
| Commitment é intenção, não mutação — carga atual sempre vem do log | `store/commitments` + `engine/progression` |
| Commitment adiado continua `pending` e reaparece | `engine/progression` |
| Deload não propõe progressão e guarda commitments pendentes | `engine/progression` + runner |
| Semana do bloco conta só sessões daquele `blockId` | `engine/block` |
| `failure_ok` por exercício | YAML |
| Lint: dois exercícios seguidos com o mesmo primário | `program/lint` |
| Lint: grupo acima de 12 séries numa sessão | `program/lint` |
| Mesociclo por regra, semana derivada de sessões concluídas | `engine/mesocycle` |
| Aquecimento não conta como volume | `engine/volume` |
| Carga vem do histórico do `id`; `seed_kg` só sem histórico | `store` + `engine/progression` |

**Armadilha conhecida:** trocar o `id` de um exercício no YAML **zera o histórico de carga dele** —
o app não tem como saber que `supino_reto` virou `supino_barra`. `id` é contrato; `name` é livre.
**Nada no código detecta isso**: o lint não tem acesso ao log, e o histórico órfão só aparece depois,
rotulado "fora do bloco atual" na tela de Histórico. A checagem é do checklist da skill
`proximo-bloco`, feita por quem escreve o bloco. Não conte com aviso automático.

**Fonte:** materiais da Escola dos Naturais, de Jayme de Lamadrid. Este documento é um resumo
operacional escrito para orientar a implementação — não substitui o material original nem o
reproduz.
