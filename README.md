# NPNG

App pessoal de treino de musculação. PWA local-only, roda no iPhone via "Adicionar à Tela de Início",
sem backend, sem login, sem nuvem. Um usuário: o Caio.

Implementa a metodologia da **Escola dos Naturais (EDN)**, de Jayme de Lamadrid.

## Por onde começar

| Arquivo | O que é |
|---|---|
| [DOCTRINE.md](DOCTRINE.md) | **Leia primeiro.** A metodologia de treino e o contrato que o código precisa honrar. As regras que parecem arbitrárias no código estão justificadas aqui. |
| [RESTRICTIONS.md](RESTRICTIONS.md) | Limites de quem treina — lesões, incômodos, adaptações. Onde conflitar com a doutrina, este vence. |
| [PLAN.md](PLAN.md) | Decisões de arquitetura, formato do YAML, motor de progressão, telas e fases de entrega. |
| [EQUIPMENT.md](EQUIPMENT.md) | Inventário da academia. Fonte de verdade do que o `training.yaml` pode prescrever. |
| [.claude/skills/proximo-bloco](.claude/skills/proximo-bloco/SKILL.md) | Procedimento para ler o histórico, diagnosticar o bloco encerrado e escrever o `training.yaml` do próximo. É o *como*; o `DOCTRINE.md` é o *porquê*. |
| [training.yaml](training.yaml) | O programa em si. Editar este arquivo e republicar = novo bloco de treino. |
| `public/ex/<id>.jpg` | Foto de cada equipamento. O nome do arquivo é o `id` que o YAML referencia. |

## Estado

Fase 1 — o programa carrega, valida e passa no lint da doutrina. Falta a interface.

- [x] Doutrina EDN destrinchada e traduzida em regras
- [x] Inventário de equipamentos levantado e revisado
- [x] Decisões de arquitetura fechadas
- [x] Scaffold Vite + React + TS + PWA
- [x] `program/` — parse, validação e lint doutrinário (12 regras)
- [x] `training.yaml` do Meso 2 (acumulação, 4 dias, superior/inferior)
- [ ] Runner de sessão, log por série, IndexedDB
- [ ] Timer de descanso com tela bloqueada
- [ ] Motor de progressão e commitments
- [ ] Export CSV e backup JSON
- [ ] Contador de volume semanal
- [ ] Mesociclo, deload, gráficos, calendário
- [ ] Import de backup

## Comandos

```
npm run dev      # servidor local (sem service worker)
npm run build    # build de produção, gera o service worker
npm test         # valida o training.yaml contra o lint da doutrina
npm run photos   # regenera o manifesto de fotos após adicionar/renomear imagens
```

`npm test` é o portão: se o `training.yaml` violar a doutrina, ele falha com a regra e o número.

## Aviso sobre as fotos

As imagens em `public/ex/` foram tiradas na academia e passaram por um filtro que borra qualquer
pessoa de terceiros que aparecesse no enquadramento — sócios, funcionários e gente visível pelas
janelas. As manchas cinzentas são intencionais. **Não substitua uma foto por uma versão "limpa" sem
refazer essa checagem.**
