---
name: proximo-bloco
description: Ler o histórico de treino do NPNG, diagnosticar o bloco que acabou e escrever o training.yaml do próximo mesociclo, seguindo a doutrina EDN. Use quando o Caio pedir para fechar um bloco, montar o próximo treino, revisar progressão, ajustar volume, decidir deload, ou perguntar "e agora, o que eu treino?".
---

# Próximo bloco de treino

Procedimento para transformar histórico em prescrição. Você é um treinador com dados, não um
gerador de planilha.

## Pré-requisito absoluto

**Leia `DOCTRINE.md` e `RESTRICTIONS.md` inteiros antes de decidir qualquer coisa.** Este arquivo é o *como*; aquele é o
*porquê*. Decisão tomada sem ele viola a metodologia com aparência de competência. Leia também
`EQUIPMENT.md` — você só pode prescrever o que existe na academia. E onde a doutrina conflitar com
o `RESTRICTIONS.md`, o `RESTRICTIONS.md` vence: um grupo abaixo da banda pode estar assim de
propósito.

Nunca aplique conhecimento genérico de hipertrofia por cima. Quando a literatura geral e o
`DOCTRINE.md` divergirem, **o `DOCTRINE.md` vence**. Ele é a escolha do Caio, não um palpite.

---

## Quando rodar

**No começo da semana de deload**, logo após a última sessão da fase de acumulação. Nesse ponto os
dados do bloco estão completos e a semana de deload é o prazo disponível para diagnosticar, escrever,
validar e publicar o bloco seguinte sem atrasar o início.

Rodar antes disso diagnostica um bloco incompleto. Rodar depois deixa o app parado no deload do
bloco anterior, com os commitments pendentes inalcançáveis até o bloco novo ser publicado.

O app avisa: durante o deload, a tela Hoje mostra um card **Próximo bloco** com o botão de exportar
o CSV.

## Passo 1 — Obter os dados

O histórico vive no iPhone (IndexedDB). O Caio exporta pelo botão Compartilhar da tela de fim de
treino. Peça o CSV se não tiver um.

Colunas:

```
timestamp, session_id, block_id, meso_week, day, exercise_id, exercise, set_index,
set_type, load_kg, load_unit, load_real_kg, reps, rir, rest_s, volume_kg
```

`set_type` é `work` ou `warmup`. **Descarte todo `warmup` antes de qualquer conta** — aquecimento
não é volume (DOCTRINE §10).

## Passo 2 — Montar a tabela de diagnóstico

Uma linha por `exercise_id`, sobre o bloco inteiro:

| Campo | Como calcular |
|---|---|
| Sessões | sessões distintas em que apareceu |
| Carga inicial → final | `load_kg` da top set da primeira e da última sessão |
| Δ carga | variação percentual |
| Reps na carga final | reps da top set nas últimas sessões |
| RIR mediano | mediana de `rir` nas séries `work` |
| Séries lixo | % de séries com `rir >= 4` |
| Aderência | sessões feitas ÷ sessões prescritas |

E uma tabela por grupo muscular: **séries efetivas/semana** (excluindo `rir >= 4`) contra a banda
do `DOCTRINE.md` §3.

## Passo 3 — Classificar cada exercício

| Classe | Assinatura nos dados | Leitura |
|---|---|---|
| **Progredindo** | carga ou reps subindo, RIR mediano 1–3 | Não mexa. Sério. |
| **Estagnado** | mesma carga e mesmas reps por 3+ sessões, RIR ≤ 2 | Estagnação real. Vá ao passo 5. |
| **Leve** | teto de reps batido com RIR ≥ 3 | Carga errada, não estagnação. Suba carga direto. O app já propõe isso sozinho desde 2026-08-12 (`DOCTRINE.md` §5, caso "leve"); se aparecer muito nesta classe, o problema é o **seed** ou a faixa, não a progressão. |
| **Regredindo** | carga ou reps caindo com RIR ≤ 1 | Sinal de recuperação, não de programa. Suspeite de excesso de volume ou vida fora da academia. |
| **Lixo** | > 30% das séries com `rir >= 4` | O exercício está sendo executado sem intensidade. Problema de esforço ou de escolha, não de prescrição. |
| **Subtreinado** | aderência < 60% | Não conclua nada sobre ele. Dados insuficientes. |

**Aderência abaixo de 60% no bloco todo invalida o diagnóstico.** Não redesenhe um programa com
base em um bloco que não foi executado — o problema é frequência, e mexer na planilha não resolve
frequência. Diga isso ao Caio em vez de entregar um YAML novo.

## Passo 4 — Diagnosticar o bloco

1. Volume efetivo semanal por grupo ficou dentro da banda? Abaixo, dentro, ou acima?
2. Qual a proporção de volume lixo no bloco todo?
3. O mesociclo foi cumprido até o fim, incluindo deload?
4. Quantos exercícios estão em cada classe do passo 3?

## Passo 4.5 — O bloco funcionou?

O diagnóstico por exercício não responde sozinho a pergunta que importa: **os números andaram?**
Emita um veredito do bloco inteiro antes de decidir qualquer coisa.

Calcule três coisas:

1. **Taxa de progresso.** Quantos exercícios saíram de "progredindo" ou fecharam pelo menos uma
   subida de carga ou de rep, sobre o total. Use a última sessão contra a primeira **do mesmo
   bloco**, nunca contra o bloco anterior.
2. **Tendência de carga total.** Soma de reps × peso por semana do bloco. Deve subir na acumulação —
   é a métrica que captura rep e carga ao mesmo tempo, e é a mesma que a tela de Histórico mostra.
   A soma já está em **carga real**: `effectiveLoad` converte `por lado` e `por halter` antes de
   somar (`DOCTRINE.md` §13.4), então exercícios diferentes são comparáveis. Duas ressalvas: o CSV
   traz `load_kg` (observado) e `load_real_kg` (convertido) — use o segundo para somar e o primeiro
   para julgar progressão.
3. **Comparação com o bloco anterior**, quando houver: a taxa de progresso caiu? Um bloco que
   entregou 80% e o seguinte 40% é um sinal de teto se aproximando, não de programa ruim.

| Taxa de progresso | Leitura | O que fazer |
|---|---|---|
| ≥ 70% | Bloco funcionou | Siga a sequência de mesociclos normalmente |
| 40-70% | Parcial | Mantenha o programa e investigue os exercícios parados individualmente |
| < 40% | Bloco não entregou | **Não** monte o próximo antes de descartar aderência, sono, alimentação e o tênis. Programa é a última hipótese, não a primeira |

**Antes de culpar o programa, descarte o resto.** Aderência abaixo de 60% já invalida o diagnóstico
(passo 3). Carga total caindo com RIR baixo em vários exercícios ao mesmo tempo é recuperação, não
prescrição — veja `RESTRICTIONS.md`, o Caio joga tênis 2× por semana e isso consome orçamento.

Se a taxa vier alta mas a carga total estiver plana, verifique a largura das faixas: um bloco inteiro
pode ter sido gasto subindo reps sem nenhuma subida de carga, o que é normal na acumulação e
esperado — mas então **diga isso no relatório**, para não parecer estagnação.

Registre o veredito no relatório do passo 9. Sem ele, o próximo bloco é escrito no escuro.

## Passo 5 — Decidir, uma variável por vez

**Regra dura: mude UMA variável por bloco.** Se você subir volume e trocar exercício ao mesmo tempo,
o próximo bloco não ensina nada — não dá para saber o que funcionou. Esta é a razão de existir do
log.

Ordem de intervenção diante de estagnação, do mais barato ao mais caro:

1. **Execução e amplitude.** Antes de qualquer mudança de números, a série está sendo levada perto
   da falha de verdade? Se o RIR mediano é 3–4, o problema é esforço. Nada de programa resolve isso.
2. **Intensidade.** Aperte o alvo de RIR (3 → 2 → 1) mantendo carga e volume. Progressão gratuita.
3. **Faixa de reps.** Estagnado a 8–12? Desça para 6–8 com mais carga. O músculo não conta reps,
   conta tensão.
4. **Volume.** Só agora, e **só depois de passar pelo portão abaixo**, que é o fluxograma
   "Quando aumentar o volume de treino" do próprio material da EDN:

   ```
   Está estagnado?
     não  → mantenha o que tem feito.
     sim  → Dormiu bem? Está em superávit calórico? Está progredindo cargas? A técnica está boa?
              alguma resposta "não" → melhore esse ponto e reavalie. NÃO aumente volume.
              tudo sob controle     → Está se recuperando bem?
                                        (as cargas melhoram? as dores no pós-treino são aceitáveis
                                         e não atrapalham os treinos seguintes?)
                  sim → provável que seja o momento de aumentar o volume
                  não → DIMINUA o volume: provavelmente está acima do seu volume máximo recuperável
   ```

   Repare no ramo da direita: quando a recuperação está ruim, a resposta do método é **cortar**
   volume, não somar. Se cortar for a saída, considere também `RESTRICTIONS.md` — tênis 2× por
   semana consome recuperação antes do treino começar.

   Passando o portão: suba **2 séries por semana** no grupo estagnado, respeitando a banda do §3.
5. **Deload.** Se carga está caindo com RIR baixo e o sono/estresse não explicam, corte para ~50%
   do volume por uma semana antes de qualquer outra coisa.
6. **Trocar o exercício.** Último recurso, e **nunca um básico** (agachamento, terra, supino,
   remada, desenvolvimento). Trocar básico zera a progressão de carga, que é o pilar nº 1
   (DOCTRINE §7). Troque acessórios à vontade.

## Passo 6 — Escolher o próximo mesociclo

Sequência canônica em `DOCTRINE.md` §9. O bloco encerrado determina o próximo:

| Bloco encerrado | Próximo, por padrão | Exceção |
|---|---|---|
| Técnica | Acumulação | Se a execução ainda oscila, repita técnica |
| Acumulação | Acumulação (se ainda cabe volume) ou Intensificação | Se já está no teto da banda, vá para intensificação |
| Intensificação | Intensificação ou Teste | Se a carga estagnou com RIR 0–1, vá para teste ou deload |
| Teste | Hipertrofia ondulante | — |

Deload obrigatório ao fim de acumulação. Não é opcional e não se pula porque "estava indo bem".

## Passo 7 — Escrever o `training.yaml`

**Acrescente um bloco à lista `blocks:`. Não substitua o bloco anterior.** O app serve o primeiro
bloco que ainda não fechou e só passa para o seguinte quando o atual completa todas as sessões,
deload incluído. Publicar cedo é seguro: o bloco novo fica enfileirado e o deload em curso não é
interrompido.

```yaml
blocks:
  - id: meso2_acumulacao      # bloco em andamento — não mexa
    ...
  - id: meso3_intensificacao  # novo, acrescentado no fim da lista
    ...
```

O `id` do bloco é registrado em cada sessão. Trocar o `id` de um bloco já treinado desconecta o
histórico dele da contagem de semanas — **nunca renomeie**.

**Nunca remova o primeiro bloco da lista.** Sessões anteriores à introdução de múltiplos blocos não
têm `blockId` e são atribuídas ao primeiro bloco declarado. Remover esse bloco faz essas sessões
serem contadas no bloco que assumir a primeira posição, que nasce em deload ou já concluído.

Formato completo em `PLAN.md`. Regras ao escrever:

- **Nunca invente `seed_kg` para um exercício que já tem histórico.** O `seed_kg` só é lido quando
  não existe log nenhum para aquele `id`. Se o exercício continua no programa, ele **mantém o `id`**
  e a carga vem sozinha.
- **`id` é contrato.** Manter um exercício com outro `id` apaga o histórico dele. Renomeie `name`
  à vontade; `id`, nunca.
### Largura da faixa vs. duração do bloco

Cada exercício recebe **`weeks` × (dias em que aparece)** tentativas no bloco — normalmente uma por
semana. A dupla progressão sobe uma rep por tentativa e só troca por carga na sessão *seguinte* à
que fecha o teto. Então, para caber pelo menos **uma** subida de carga dentro do bloco:

```
reps[1] − reps[0] < tentativas do exercício no bloco
```

Com um bloco de 4 semanas e o exercício aparecendo 1× por semana:

| Faixa | Largura | Subidas de carga em 4 sessões |
|---|---|---|
| 6-8, 8-10, 10-12, 4-6 | 2 | 1 |
| 5-8, 12-15 | 3 | 1, na última sessão |
| 8-12 | 4 | **0** — a escada não fecha |

Não é erro: um bloco de acumulação existe para somar volume com intensidade estável, e a carga é o
trabalho do bloco de intensificação seguinte. Mas **faixa de largura ≥ `weeks` significa que aquele
exercício não vai ver carga nova no bloco inteiro** — decida de propósito, não por acidente.

Quando quiser garantir a subida, estreite a faixa (8-12 → 8-10) ou dê ao exercício uma segunda
aparição na semana. Quando o exercício for acessório de alta rep e a carga não for o ponto, uma faixa
larga é perfeitamente adequada.

- `increment` reflete o equipamento real: placa (pino) tem passo fixo; anilha depende do que a
  academia tem. Veja `EQUIPMENT.md` — há dois leg press com incrementos diferentes.
- `failure_ok: false` em todo multiarticular livre. `true` em máquina e isolador.
- Faixa de reps e `rir` alvo saem da tabela por classe de exercício (DOCTRINE §4). Multiarticular
  livre é o de RPE mais baixo, não o mais alto.
- Ordem dos exercícios: básico livre cedo, acessório depois. Nunca dois exercícios seguidos com o
  mesmo músculo primário.

## Passo 8 — Validar antes de entregar

Checklist, todos obrigatórios:

- [ ] Todo `exercise_id` existe como foto em `public/ex/<id>.jpg` e como linha em `EQUIPMENT.md`
- [ ] Séries efetivas/semana de cada grupo dentro da banda do §3 — some à mão e confira
- [ ] Nenhum grupo com mais de 12 séries num único dia (se passar, divida na semana)
- [ ] Nenhum par consecutivo com o mesmo músculo primário
- [ ] Todo padrão de movimento tocado ~2× na semana
- [ ] Nenhum `id` de exercício mantido foi renomeado — **não há aviso automático para isso**
- [ ] O veredito do passo 4.5 foi calculado e está no relatório
- [ ] O bloco novo foi **acrescentado** à lista, com `id` inédito, sem alterar os anteriores
- [ ] O `name` segue a contagem do Caio (Bloco 2, Bloco 3…), não a numeração de mesociclo do método
- [ ] Toda faixa com largura ≥ `weeks` é intencional — aquele exercício não sobe carga no bloco
- [ ] Exatamente uma variável mudou em relação ao bloco anterior
- [ ] Deload declarado se o bloco anterior foi acumulação

## Passo 9 — Entregar

Entregue nesta ordem, sempre:

1. **Diagnóstico** — a tabela do passo 2, as classes do passo 3 e o **veredito do bloco** do passo
   4.5 (taxa de progresso, tendência de carga total, comparação com o bloco anterior).
2. **A decisão e o porquê** — qual variável mudou, ancorada na seção do `DOCTRINE.md`.
3. **O YAML** — o bloco novo.
4. **O que observar** — que sinal, no próximo bloco, confirma ou refuta a decisão.

O item 4 não é enfeite. É o que transforma o próximo bloco em informação em vez de palpite.

---

## Não faça

- Não redesenhe um programa que está funcionando. "Progredindo" significa não mexer.
- Não suba volume como primeira resposta à estagnação. É o passo 4 de 6, não o 1.
- Não passe do teto da banda de volume "só neste bloco". Não existe só neste bloco.
- Não troque exercício básico para "variar o estímulo". Isso é a anti-doutrina (DOCTRINE §13).
- Não prescreva equipamento que não está no `EQUIPMENT.md`.
- Não mude duas variáveis de uma vez.
- Não conclua nada de um bloco com aderência baixa.
- Não aplique heurística genérica de hipertrofia por cima da doutrina.

## Escale para o Caio

Decida sozinho o que é rotina. Pare e pergunte quando:

- Aderência < 60% — o problema não é o programa.
- Os dados sugerem lesão ou dor (carga caindo num só exercício, com os outros firmes).
- A solução exigiria equipamento que a academia não tem.
- A doutrina e os dados apontam para lados opostos.
- Você quer trocar um exercício básico.
