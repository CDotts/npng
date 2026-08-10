# Inventário de Equipamentos — Academia

Levantado a partir de 29 fotos da academia. Praticamente tudo Technogym: linha Selection Pro nas
máquinas com placa, Pure / Plate Loaded nas de anilha.

Este arquivo é a **fonte de verdade do que pode entrar no `training.yaml`**. Exercício sem
equipamento aqui não é prescrito.

As fotos vivem em `public/ex/<id>.jpg` — o nome do arquivo é o `id` que o YAML referencia.
Para revisar um ID, abra a foto de mesmo nome.

## Livres, racks e bancos

| id | Nome | Confiança |
|---|---|---|
| `rack` | Power rack com barra olímpica, ganchos em J e barras de segurança | alta |
| `smith` | Smith machine | alta (confirmado pelo Caio) |
| `banco_declinado_barra_supino` | Banco declinado olímpico com suporte de barra e rolos de perna | alta |
| `banco_inclinado_barra_supino` | Banco inclinado olímpico com suporte de barra e apoio de pés | alta |
| `banco_regulavel` | Banco regulável plano/inclinado (2+ unidades) | alta |
| `banco_supino_reto` | Banco de supino reto com suporte de barra e porta-anilhas na estrutura | alta (confirmado pelo Caio) |
| `banco_scott` | Banco scott / rosca scott | alta (confirmado pelo Caio) |
| `banco_romano` | Banco romano / hiperextensão 45° | alta |
| `halteres` | Rack de halteres, ~10 pares | alta |
| `barra_fixa` | Barra fixa, montada no alto e ao centro da torre bilateral do crossover | alta (confirmado pelo Caio) |

## Máquinas com placa (Technogym Selection Pro)

| id | Nome | Confiança |
|---|---|---|
| `lat_machine` | Lat Machine — puxada alta, barra reta, rolos de coxa | alta (placa legível) |
| `low_row` | Low Row — remada baixa sentada com apoio de peito | alta (placa legível) |
| `pulley` | Pulley — remada baixa com plataforma de pés e banco | alta (placa legível) |
| `chest_press` | Chest Press — supino máquina | alta (placa legível) |
| `shoulder_press` | Shoulder Press — desenvolvimento sentado | alta (placa lida em crop 10x) |
| `abdominal_crunch` | Abdominal Crunch | alta (placa legível) |
| `cadeira_extensora` | Leg Extension | alta |
| `mesa_flexora` | Mesa flexora deitada | alta (confirmado pelo Caio) |
| `cadeira_abdutora_adutora` | Hip Abductor + Hip Adductor — duas máquinas lado a lado | média |
| `leg_press` | Leg press horizontal sentado, com placa | alta |
| `crossover` | Crossover duplo (duas torres de polia alta) + polia ajustável | alta |

Sobre `cadeira_abdutora_adutora`: são duas máquinas distintas (duas pilhas de peso independentes,
confirmado). O borrão da foto impede dizer qual é qual — irrelevante para o app, e o YAML declara
as duas separadamente na hora de escrever o programa.

## Máquinas de anilha (plate-loaded)

| id | Nome | Confiança |
|---|---|---|
| `leg_press_anilha` | Leg press de anilha | alta (confirmado pelo Caio) |
| `hip_thrust` | Máquina de elevação pélvica | média-alta |

Correção de catalogação: `banco_supino_reto` chegou a ser classificado como máquina de anilha. Os
pinos carregados na estrutura são **porta-anilhas**, não braço de alavanca — é um banco de supino
com barra livre, e é onde o supino reto do programa é feito.

Há **dois leg press**: `leg_press` (horizontal, com placa — progressão pelo pino) e
`leg_press_anilha` (de anilha — progressão pelo incremento da anilha disponível). Para o motor de
progressão são exercícios diferentes, com `increment` diferente. Não unifique.

## Cardio

`cardio_esteira` (2+), `cardio_escada`, `cardio_eliptico`, `cardio_bike_vertical`,
`cardio_bike_spinning` (2).

Registrado só para completude. O EDN trata cardio como ferramenta de gasto calórico, não de
hipertrofia — não entra no `training.yaml` nem na contagem de volume.

## Restrições confirmadas

- **Panturrilha não tem máquina dedicada.** Só no leg press (ponta do pé na borda da plataforma) ou
  no Smith. Vira `panturrilha_leg_press` no YAML.
- **Não há peck deck / crucifixo invertido.** Suprido por `crossover` e `halteres`.
- **Não há hack squat nem agachamento pendular.** Suprido por `rack`, `leg_press` e `smith`.
- **Flexora só na versão deitada.** O EDN não distingue as duas, então não muda a prescrição.

## Manutenção deste arquivo

Toda foto em `public/ex/` tem que ter uma linha aqui, e todo `id` do `training.yaml` tem que ter
foto. Se você renomear uma foto **depois** que o `training.yaml` existir, renomeie o `id` no YAML na
mesma mudança — senão o histórico de carga daquele exercício é perdido (ver `DOCTRINE.md`, §15).
