# NPNG — Plano de Construção

App pessoal de treino, local-only, iPhone. Implementa a doutrina da **Escola dos Naturais (EDN)**
de Jayme de Lamadrid. Um usuário, sem backend, sem autenticação, sem conta de desenvolvedor Apple.

---

## 1. Decisões travadas

| # | Decisão | Escolha |
|---|---|---|
| 1 | Runtime | **PWA** (React + Vite + TS) servido por GitHub Pages, "Adicionar à Tela de Início" |
| 2 | Timer de descanso | **Notificação, sem som.** Alarme sonoro removido: no iOS não há combinação que seja audível, não roube a sessão de áudio da música e sobreviva à tela bloqueada (histórico em `DOCTRINE.md` §13.5). Wake Lock mantém a tela acesa; se ela apagar, o app notifica o atraso real ao voltar |
| 3 | Divisão | **4 dias — Upper / Lower / Upper / Lower** (exemplo do próprio EDN, p.98-100) |
| 4 | Log | **Por série** (reps + carga + RIR em cada série) |
| 5 | Progressão | **Por exercício**, dupla progressão, botão sugere e você confirma |
| 6 | Esforço | **RIR por série**, alvo declarado no YAML |
| 7 | YAML | Declara exercícios, faixas, RIR, incremento **e carga inicial** (seed) |
| 8 | Durabilidade | IndexedDB + **export CSV** pós-treino + **import** de volta |
| 8b | Passo de carga | **0,5 kg fixo** no ajuste, para qualquer exercício. Adivinhar a menor anilha de cada aparelho é inviável. Não confundir com `increment`, que é quanto a progressão sobe |
| 8c | Unidade de carga | `load_unit` por exercício (`total`, `por lado`, `por halter`), **visível ao lado do stepper**. Sem isso o mesmo exercício é registrado com convenções diferentes entre sessões e a progressão compara números incomparáveis. Convenção do Caio (barra = anilhas de cada lado, halter = cada halter, máquina = o pino) em `DOCTRINE.md` §13.4 |
| 8d | Tempo de montagem | 40s por série em multiarticular livre (barra + anilha), 15s no resto. Medido em campo: 15s para tudo errava 36% numa sessão de barra |
| 8e | Carga real | O observado é o dado gravado; `effectiveLoad` converte na **leitura** (`por lado` → ×2 + `bar_kg`, `por halter` → ×2). Só tonelagem usa o convertido; progressão e stepper usam o observado. Nunca migrar log por troca de convenção |
| 9 | Aquecimento | **Lembrete estático** (50/70/80/90%), não logado, não contado |
| 10 | Volume | **Contador semanal de séries por grupo muscular**, ao vivo, contra a banda EDN |
| 11 | CSV | **Uma linha por série**, formato largo |
| 12 | Mídia | **Uma foto por exercício**, no bundle (`public/ex/<id>.jpg`) |
| 13 | Idioma | **Português** |
| 14 | Escopo v1 | **Tudo**: loop principal + gráficos + calendário/histórico + mesociclo/deload |
| 15 | Mesociclo | **Baseado em regras** no YAML, não tabelas escritas à mão |
| 16 | Bloco inicial | **Meso 2 — acumulação** (séries sobem semana a semana, intensidade fixa ~80%) |

---

## 2. Doutrina EDN → regras de código

O que o app precisa fazer para ser fiel ao livro, e onde isso vive:

| Princípio EDN | Página | Implementação |
|---|---|---|
| 12 séries/semana grupos grandes, ~8 grupos pequenos | 17 | `WeeklyVolume` — bandas por grupo, verde/âmbar/vermelho |
| "Volume lixo" = série longe da falha não conta | 16-17 | Séries com RIR ≥ 4 marcadas e **descontadas** do contador |
| Séries válidas = próximas da falha, RIR 1-3 | 26-27 | Alvo de RIR por exercício no YAML, chip na UI |
| Sobrecarga progressiva é a via principal do natural | 46-50 | Motor de dupla progressão |
| Dupla progressão: reps até o teto (≤15) → reset + carga | 49 | `progressExercise()` |
| Progrida na **top set** primeiro | 36 | Regra do bump olha a melhor série |
| Falha mecânica: evitar em livres multiarticulares | 27-28 | YAML: `failure_ok: false` em agachamento/terra/supino |
| Falha técnica: ok em máquinas/isoladores, no fim | 28 | `failure_ok: true` em cadeira flexora, crucifixo etc. |
| Faixa de reps por tipo de exercício | (Planilha) | Tabela abaixo, vira default no YAML |
| Não encadear exercícios do mesmo grupo | 64-66 | **Lint do YAML** avisa se dois seguidos compartilham o primário |
| Padrões de movimento > grupos musculares | 51-53 | Cada exercício tem `pattern:` (push_h, push_v, pull_h, pull_v, knee, hip) |
| Frequência 2 quando volume > 10-12 séries | 22 | Lint avisa se um grupo passa de 12 séries em um só dia |
| Não trocar exercício básico constantemente | 54 | Trocar o `id` de um básico = perde histórico. Checagem manual no checklist da skill — o lint não enxerga o log |
| Descanso: 2-4 min compostos, menos em isoladores | 89 | `rest:` por exercício, default por padrão de movimento |
| Deload ~50% do volume ao fim da acumulação | 84 | `deload_week` na regra do mesociclo |
| Registre tudo, sempre | 48, 88 | O app inteiro |

### Faixas RPE ↔ reps (da Planilha de Treino, vira default)

| Classe de exercício | Reps | RPE |
|---|---|---|
| Multiarticular inferior livre | 3-8 | 6-8 |
| Multiarticular inferior guiado | 6-12 | 6-9 |
| Acessório inferior | 8-20 | 7-10 |
| Multiarticular superior livre | 3-12 | 6-9 |
| Multiarticular superior guiado | 6-15 | 6-10 |
| Acessório superior | 8-20 | 7-10 |

RIR = 10 − RPE (RPE 10 → RIR 0; RPE 8 → RIR 2).

---

## 3. Arquitetura

```
npng/
├── training.yaml            ← o programa inteiro. Editar isto = novo bloco.
├── public/
│   └── ex/<id>.jpg          ← fotos das máquinas da sua academia
├── src/
│   ├── program/             ← parse + validação do YAML, lint doutrinário
│   ├── engine/              ← progressão, mesociclo, contagem de volume
│   ├── store/               ← IndexedDB (log append-only), export/import CSV
│   ├── session/             ← runner do treino (a tela que você usa na academia)
│   ├── screens/             ← Hoje, Treino, Volume, Histórico, Exercício, Ajustes
│   └── timer/               ← Wake Lock + notificação de fim de descanso
└── vite.config.ts           ← base: '/npng/', plugin PWA
```

**Costura central:** o YAML é a *prescrição*, o log é a *verdade*. Carga atual de um exercício =
última carga registrada para aquele `id`; o `seed` do YAML só é usado quando **não existe histórico**
para o `id`. Trocar de bloco (novo YAML) nunca apaga carga — desde que os `id`s se mantenham.

`engine/` é **função pura de (Program, Log) → prescrição**. Nenhum estado derivado é persistido:
carga atual, prescrição da semana, volume efetivo e semana do mesociclo são sempre recalculados.
É isso que torna a doutrina testável sem UI e a troca de bloco inofensiva.

### Persistência

Quatro stores em IndexedDB:

| Store | Natureza | Conteúdo |
|---|---|---|
| `sessions` | append-only | `id, startedAt, endedAt, dayId, mesoWeek, blockId` |
| `sets` | append-only | `id, sessionId, exerciseId, index, type, loadKg, reps, rir, restS` |
| `commitments` | append-only | `id, exerciseId, createdAt, targetReps, targetLoadKg, status, resolvedAt` |
| `setups` | last-write-wins | `exerciseId, text, updatedAt` — regulagem da máquina |

### Commitments

Um commitment é uma **intenção declarada, não uma mudança aplicada**. Ao fechar a última série de um
exercício o app propõe subir, ali mesmo, com o julgamento fresco; aceitar cria um commitment
`pending`. A tela de fim repete as propostas não decididas. Ele **não altera a carga atual** — carga atual continua
saindo do log.

Na próxima vez que o exercício aparecer, o runner mostra o commitment e pede confirmação:

- **Honrar** — você registra a série na carga comprometida. O commitment vira `honored`.
- **Adiar** — você treina na carga anterior. O commitment **continua `pending`** e reaparece na
  sessão seguinte.
- **Descartar** — some, e um novo pode ser criado no fim daquele treino.

O caso que motiva o desenho: comprometer subida → adoecer → treinar uma semana sustentando a carga
para recuperar → subir de fato na terceira semana. A intenção sobrevive às três semanas sem exigir
que você se lembre dela, e sem que o app minta sobre qual carga você de fato levantou.

### Rotação dos dias

A ordem A→B→C→D é derivada da **última sessão concluída**, nunca do dia da semana. Faltou uma
semana? Você retoma de onde parou. O app nunca "perde" um treino nem pula letra por causa do
calendário.

### Exportação: dois arquivos, dois propósitos

- **`npng-treinos.csv`** — uma linha por série, o que vai pro WhatsApp. Legível por humano.
- **`npng-backup.json`** — os quatro stores inteiros. É o que o import restaura.

O CSV sozinho não restaura o estado: ele não carrega commitments nem regulagens de máquina. Manter
os dois é mais honesto do que forçar tudo num CSV e descobrir na hora do desastre que faltava metade.

### Blocos enfileirados

O `training.yaml` declara uma **lista** de blocos. O app serve o primeiro que ainda não completou
todas as suas sessões (semanas de acumulação + deload) e só então passa ao seguinte, que recomeça na
semana 1. Cada sessão registra o `blockId`, então a contagem de semanas de um bloco nunca é
contaminada pelo histórico dos anteriores.

Consequência prática: o próximo bloco pode ser publicado assim que a última semana de acumulação
fecha, sem interromper o deload em curso. Sem isso, publicar cedo derrubaria o deload e publicar
tarde deixaria o app parado.

### Formato do YAML

```yaml
mesocycle:
  name: "Meso 2 — acumulação"
  type: acumulacao
  weeks: 4
  deload_week: 5           # semana 5 = 50% do volume
  rule: sets_ramp          # séries sobem 3→4→5→6, intensidade fixa
  intensity_pct: 80

muscles:                   # bandas EDN por grupo
  quadriceps: { min: 10, max: 14 }
  costas:     { min: 10, max: 14 }
  biceps:     { min: 6,  max: 10 }

exercises:
  - id: supino_reto
    name: Supino Reto
    photo: ex/supino_reto.jpg
    pattern: push_h
    class: multi_sup_livre
    primary: [peitoral]
    secondary: [triceps, deltoide]
    reps: [6, 8]
    rir: 2
    increment: 2.5
    rest: 180
    failure_ok: false
    seed_kg: 40
    warmup_hint: true      # mostra 50/70/80/90%
    setup_hint: ""         # regulagem padrão; o ajuste real vive no store, editável no app

days:
  - id: A
    name: "Superior"
    exercises: [supino_reto, barra_fixa, crossover, pull_down, rosca_direta, triceps_frances, abdomen]
  - id: B
    name: "Inferior"
    exercises: [terra_romeno, rack_squat, mesa_flexora, cadeira_extensora, panturrilha_pe, panturrilha_sentado]
  # C = Superior (ênfase costas/ombro), D = Inferior (agachamento + hip thrust)
```

### Motor de progressão

```
onSessionEnd(exercise):
  sets = séries de trabalho registradas
  if todas atingiram o topo da faixa AND todas com rir <= alvo:
      if reps_alvo < teto_da_faixa:  propor reps++
      else:                          propor reps = piso, carga += increment
  else:
      manter
  → sempre uma proposta, nunca uma mutação. Você aceita ou descarta.
```

Sobreposto a isso, a **regra do mesociclo** (`sets_ramp` na acumulação) mexe no número de
**séries** por semana; a dupla progressão mexe em reps/carga. As duas não brigam: EDN manda
segurar a intensidade estável enquanto o volume sobe (p.78).

### Timer com tela bloqueada

Ao iniciar o treino: `<audio src="silence.mp3" loop autoplay>` + `navigator.wakeLock`.
Enquanto o áudio toca, o iOS mantém o processo vivo e o `setInterval` continua contando com a
tela bloqueada; ao chegar a zero toca `alarm.mp3` + vibra.

**Risco declarado:** isto é um hack de plataforma, não uma API. Se a Apple apertar, degrada para
timer em primeiro plano. Vamos **testar no seu iPhone real na primeira sessão** antes de confiar.

### CSV

```
timestamp,session_id,day,exercise_id,exercise,set_index,set_type,load_kg,reps,rir,rest_s,volume_kg
2026-08-09T08:38:12,s142,B,cadeira_flexora,Cadeira Flexora,1,work,63,12,2,80,756
```

Um arquivo = histórico completo, com `block_id` e `meso_week` em cada linha para delimitar o bloco.
Botão "Compartilhar" na tela de fim de treino → share sheet do iOS → WhatsApp. **A restauração é
pelo backup JSON**, não pelo CSV: o CSV não carrega commitments nem regulagens.

---

## 4. Telas

1. **Hoje** — qual treino toca (A/B/C/D em rotação), semana do mesociclo, botão Iniciar
2. **Treino (runner)** — a tela que fica na sua mão: exercício atual, foto, faixa alvo, RIR alvo,
   linhas de série com stepper de reps/carga e chip de RIR, timer de descanso, próximos exercícios
3. **Volume** — séries/semana por grupo vs. banda EDN, com o desconto do volume lixo
4. **Histórico** — calendário, sequência de semanas, sessões passadas
5. **Exercício** — foto, evolução de carga (gráfico), suas anotações, ativação muscular
6. **Ajustes** — export/import CSV, versão do bloco, reset

---

## 5. Fases de entrega

| Fase | Entrega | Verificação |
|---|---|---|
| 0 | Repo acessível, scaffold Vite+React+TS+PWA, deploy no Pages | Abre no iPhone, instala na tela de início, funciona em modo avião |
| 1 | Parser + lint do YAML, `training.yaml` real com suas máquinas | Lint passa; contagem de volume bate com a banda EDN |
| 2 | Runner de sessão + log por série + IndexedDB | Uma sessão completa registrada, sobrevive a fechar o app |
| 3 | Timer com áudio keep-alive | **Teste no seu iPhone**: bloqueia a tela por 3 min, alarme toca |
| 4 | Motor de progressão + tela de fim + export CSV | Segunda sessão propõe o bump certo; CSV chega no WhatsApp |
| 5 | Contador de volume semanal | Números batem com a soma manual do YAML |
| 6 | Mesociclo + deload + gráficos + calendário | Semana 5 propõe deload de 50% |
| 7 | Import do backup JSON | Wipe do app + import = histórico de volta |

Fases 0-4 = app treinável. Você pode começar a usar no fim da fase 4.

---

## 6. Pendências

- **Acesso ao repo.** O `gh` desta máquina está autenticado como `dotts-fit` e não enxerga
  `CDotts/npng`. Ou dá acesso a essa conta, ou eu troco pra conta CDotts (`gh auth login`), ou
  criamos o repo sob `dotts-fit`. Nada mais anda até isso.
- **Fotos das máquinas.** Sem elas o `training.yaml` não pode ser escrito de verdade — não dá pra
  prescrever rack squat se não tem rack. Manda a pasta.
- **Cargas iniciais.** Já dá pra semear do que li nos prints: cadeira flexora 63, cadeira abdutora 90,
  levantamento terra 35, stiff barra 30. Falta o resto.

## 7. Riscos

| Risco | Mitigação |
|---|---|
| Hack de áudio quebrar com update do iOS | Testar na fase 3; fallback = timer em primeiro plano com Wake Lock |
| iOS despejar o IndexedDB | Export CSV a cada treino é backup, não só export. Import fecha o ciclo |
| Trocar `id` de exercício zera histórico | Lint avisa; `id` é contrato, `name` é livre |
| Deploy do Pages exigir repo público | Se `npng` for privado, Pages precisa de plano pago — alternativa: build local + hospedar em outro lugar, ou repo público (não tem segredo nenhum aqui) |
