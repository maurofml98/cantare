# Cantare

Plataforma para cantores brasileiros. Treino vocal com análise de áudio, saúde vocal
com curadoria clínica, e gestão de repertório para shows.

## Rodar

```bash
npm install
npm run dev
```

Requer `.env.local` na raiz:

```
VITE_SPOTIFY_CLIENT_ID=
VITE_SPOTIFY_CLIENT_SECRET=
```

## Documentação

Leia nesta ordem:

| Arquivo | O que é |
|---|---|
| `CLAUDE.md` | Contexto do projeto. Quem é quem, o que a Laury pediu, o que já tentamos e falhou. **Leia primeiro.** |
| `docs/ROADMAP.md` | As fases do produto e o que entra em cada uma |
| `docs/BACKLOG.md` | Tarefas concretas, prontas para execução |
| `docs/ARQUITETURA.md` | Como o motor de treino funciona. Schema de exercício, detecção de pitch |
| `docs/CURRICULO-LAURY.md` | Formulário para a Laury preencher. **É o bloqueador do projeto.** |
| `docs/DESIGN.md` | Tokens visuais e o histórico de rejeições |

## Estado

Fase 0 — migração do Lovable e fundação. Ver `docs/ROADMAP.md`.
