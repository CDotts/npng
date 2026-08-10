# Restrições individuais

Contexto pessoal que **precede a doutrina**. O `DOCTRINE.md` descreve o método; este arquivo
descreve os limites da pessoa que treina. Onde os dois conflitarem, **este arquivo vence** — a
doutrina é geral, a lesão é específica.

Um agente que monte ou ajuste treino sem ler isto vai reintroduzir um problema achando que está
corrigindo um buraco de volume. É o erro mais fácil de cometer: a tela de Volume mostra um grupo
abaixo da banda, e a correção "óbvia" é justamente o que precisa ficar de fora.

## Convenção

Cada restrição declara **o quê**, **desde quando**, **o que já foi adaptado** e **o que não
fazer**. Restrição sem data vira folclore — datas permitem revisar.

---

## Braço direito — braquial

- **Desde:** meados de 2026, ainda em curso em agosto de 2026.
- **Sintoma:** sensação estranha no braço direito em trabalho de **braquial** com halter — a "rosca
  lateral" da série antiga. Não descrito como dor.
- **O que NÃO está restrito:** **rosca direta é liberada e faz parte da rotina normal dele.** A
  restrição é específica do braquial, não do bíceps como um todo.
- **Já adaptado:** parou o movimento de braquial; passou a usar remada com carga menor,
  concentrando a puxada nas costas em vez do braço.
- **Não faça:** não classifique bíceps inteiro como proibido — foi o erro cometido na primeira
  versão do programa, que ficou sem nenhuma série direta de bíceps por generalização indevida.
  Também não reintroduza rosca martelo, rosca inversa ou pegada neutra sem perguntar: são as
  variações que carregam o braquial.
- **Escale:** se a sensação virar dor, ou aparecer na rosca direta, isso sai do escopo de
  programação de treino. Diga isso e pare.

## Tênis 2× por semana

- **Desde:** hábito corrente em agosto de 2026.
- **Consequência:** a musculação não é a única carga da semana. Tênis é impacto, corrida curta e
  mudança de direção — fadiga sistêmica real, com peso em pernas e ombro. O orçamento de recuperação
  já está parcialmente gasto antes do treino começar.
- **Como isso já está refletido:** o bloco atual fica na parte de baixo das bandas nos grupos
  pequenos e no meio nos grandes, em vez de buscar o teto.
- **Não faça:** não trate "abaixo do teto da banda" como espaço livre para somar séries sem antes
  perguntar como está a recuperação e a frequência do tênis.

## Teto de 50 minutos por sessão

- **Desde:** agosto de 2026, definido pelo Caio.
- **Consequência:** nenhuma sessão pode passar de 50 min estimados. Isso é uma restrição de agenda,
  não de treino, e **compete diretamente com as bandas de volume** — o cálculo cabe em ~15-16 séries
  de trabalho por sessão, e 4 dias disso não alcançam a soma dos mínimos de todas as bandas.
- **Resolução adotada:** cortar acessórios de baixa prioridade (elevação lateral, tríceps testa,
  cadeira abdutora), deixar grupos pequenos no piso da banda e preservar o descanso longo dos
  compostos. Grandes grupos ficam na banda; pequenos vivem majoritariamente de trabalho indireto.
- **Exceção consciente (agosto de 2026):** com a entrada da rosca direta, os dias **A (~53 min)** e
  **C (~51 min)** passam do teto no pico do bloco. Foi escolha do Caio: preferiu 3 minutos a mais a
  deixar o bíceps abaixo da banda ou encurtar o descanso dos compostos. O lint continua acusando, e
  o teste fixa que **apenas A e C** podem estourar — um terceiro dia quebra o build.
- **Não faça:** não recupere volume encurtando o descanso de agachamento, terra e supino. O descanso
  longo neles é o que sustenta a carga, que é o pilar nº 1.

## Retomada após período irregular

- **Desde:** o bloco anterior expirou; 15 sessões registradas no ano anterior.
- **Consequência:** frequência real importa mais que frequência ótima. Antes de propor mais volume
  ou um bloco mais agressivo, verifique aderência — o procedimento está na skill `proximo-bloco`,
  que bloqueia o diagnóstico abaixo de 60%.

## Cargas herdadas de outra academia

- **Desde:** agosto de 2026, mudança da SmartFit para a academia do clube.
- **Consequência:** os `seed_kg` do bloco atual vieram da série antiga, feita em outra academia.
  Os de peso livre transferem; os de máquina (pilha, alavanca e perfil de resistência diferentes)
  são estimativa. Espere ajustar nas primeiras sessões — o app permite sobrescrever a carga em
  qualquer série, e pede confirmação na primeira vez que um exercício aparece sem histórico.
