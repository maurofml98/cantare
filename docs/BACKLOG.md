# Backlog

Tarefas concretas. Cada uma é executável por conta própria — dá para pedir ao Claude
Code uma por vez sem precisar explicar contexto.

Ordenadas por fase. Ver `ROADMAP.md` para o porquê de cada fase.

---

## Fase 0 — Fundação

### 0.1 · Rotacionar a chave do YouTube exposta

Uma chave de API do Google foi colada em chat durante o desenvolvimento. Deve ser
considerada comprometida.

```
1. console.cloud.google.com → APIs e Serviços → Credenciais
2. Excluir a chave antiga
3. Criar nova (só se ainda for usada — ver 0.2)
4. Restringir a chave: apenas YouTube Data API v3 + restrição de site
```

### 0.2 · Remover código da integração YouTube — concluído

A integração foi abandonada. O YouTube não tem endpoint de "viral" ou "em alta", e em
fevereiro de 2026 o Google removeu endpoints relevantes.

- Localizar e remover chamadas a `googleapis.com/youtube`
- Remover `YOUTUBE_API_KEY` dos secrets se não houver mais uso
- Confirmar que a tela de Tendências usa só Spotify

### 0.3 · Auditar IDs de playlist do Spotify — concluído

**Resultado (14/09/2026):** os 20 IDs deram 404. Desde novembro de 2024 o Spotify
nega a apps novos playlists editoriais, e `/playlists/{id}/tracks` dá 403 até em
playlist de usuário. IDs removidos e trocados por `/v1/search?type=track`. O plano
abaixo e a lista de "confirmados oficiais" ficaram obsoletos — ver
`ARQUITETURA.md`, seção Spotify.

**Risco real de quebra silenciosa.** O Lovable implementou "curadoria de IDs fixos"
de playlists supostamente editoriais. Só os IDs com prefixo `37i9dQZEVXb` são
oficiais do Spotify e estáveis. Os outros são de usuários comuns e podem ser
deletados ou renomeados a qualquer momento.

```
1. Localizar todos os IDs de playlist hardcoded no código
2. Para cada um: GET /v1/playlists/{id} e verificar o campo owner
3. owner.id === 'spotify' → estável, manter
4. Qualquer outro → substituir por busca dinâmica (/v1/search?type=playlist)
5. Documentar o resultado numa tabela neste arquivo
```

Confirmados oficiais:
- `37i9dQZEVXbMXbN3EUUhlg` — Top 50 Brasil
- `37i9dQZEVXbKzoK95AbRy9` — Top Songs Brasil

### 0.4 · Tratar falha de playlist — concluído

Quando uma playlist retorna 404 ou vem vazia, hoje a tela provavelmente mostra estado
vazio sem explicação. Deve cair no fallback de busca dinâmica automaticamente.

Resolvido eliminando playlists: a tela usa só busca de faixas, com erro visível e
"tentar novamente".

### 0.5 · Segredos fora do repositório — concluído

- `.env`, `.env.local`, `.env.*` no `.gitignore`
- Nenhuma chave literal no código-fonte
- `git log -p | grep -i "api.key\|secret\|AIza"` para conferir histórico

### 0.6 · Desacoplar o `@lovable.dev/vite-tanstack-config`

O build depende de um preset de config do Lovable (devDependency). Isso prende o
projeto à plataforma de origem e esconde a configuração real do Vite/TanStack Start/
Nitro.

- Ver o que o preset configura hoje (plugins, SSR, Nitro, aliases)
- Replicar explicitamente no `vite.config.ts`
- Remover a dependência e confirmar `dev` e `build` funcionando

### 0.7 · Autenticação real e persistência fora do `localStorage`

Hoje o login aceita qualquer email/senha e grava o usuário em `localStorage`. Projetos,
perfil vocal e histórico também vivem só no navegador — trocar de aparelho ou limpar
dados apaga tudo.

- Escolher provedor de auth e banco
- Migrar os dados existentes de `localStorage` no primeiro login
- Perfil vocal é dado biométrico (LGPD): consentimento, criptografia, opção de
  deletar — ver seção 10 do `CLAUDE.md`

---

## Fase 1 — Onboarding vocal

### 1.1 · Portar o teste de extensão — concluído

Existe uma implementação funcional em `teste-vocal-cantare.jsx` — autocorrelação,
medição de ruído, estabilização, classificação. Portar para a estrutura do projeto:

```
src/motor/analise/pitch.ts        # detecção, conversões Hz↔MIDI
src/motor/analise/ambiente.ts     # medição de ruído
src/perfil/TesteExtensao.tsx      # a tela
src/perfil/classificar.ts         # MIDI → tipo vocal
```

Manter os parâmetros calibrados de `ARQUITETURA.md`. Não mexer sem testar com voz
real.

### 1.2 · Inserir no fluxo de cadastro

Depois do cadastro, antes de chegar na home. Com opção de pular — quem pula recebe
exercícios genéricos e um aviso de que pode fazer o teste depois.

### 1.3 · Persistir perfil vocal

```ts
type PerfilVocal = {
  midiMin: number;
  midiMax: number;
  tipoEstimado: TipoVocal;
  medidoEm: string;
  qualidadeMedicao: 'boa' | 'media' | 'ruim';
}
```

Guardar **histórico**, não só o último registro. A extensão muda com treino e com o
dia.

### 1.4 · Refazer o teste

Botão acessível a qualquer momento. Nunca tratar a classificação como definitiva — a
própria Laury teve resultado diferente em dois dias.

---

## Fase 2 — Motor de treino

### 2.1 · Definir os tipos

Criar `src/motor/tipos.ts` com os schemas de `ARQUITETURA.md`:
`Exercicio`, `Etapa`, `TipoAnalise`, `Ressonancia`, `PerfilVocal`, `TipoVocal`.

### 2.2 · Resolver alvos relativos

`src/motor/alvos.ts`:

```ts
resolverAlvos(exercicio, perfil) → { midi, duracaoSeg }[]
```

Base = `perfil.midiMin + 3`. Teto = `perfil.midiMax - 2`. Se algum alvo passar do
teto, comprimir a amplitude do exercício. **Requisito clínico, não otimização.**

### 2.3 · Componente MotorTreino

Uma tela, três estados: instrução → execução → resultado.
Recebe `Exercicio` e `PerfilVocal`. Despacha para o analisador conforme
`tipoAnalise`.

Não criar tela por exercício. Se aparecer `ExercicioRespiracao.tsx` no projeto, está
errado.

### 2.4 · Analisador de sustentação

`src/motor/analise/sustentacao.ts`. Para o "SSS" de 30s.
Detecta quebra quando RMS cai abaixo do gate por mais de 250ms.
Resultado: "sustentou 22 de 30 segundos". Sem punição, com repetição imediata.

### 2.5 · Analisador de pitch com trilha

Trilha horizontal de notas-alvo + marcador vertical da voz ao vivo. A referência
visual de escada já existe em `teste-vocal-cantare.jsx` (componente `Ladder`).

Acerto = dentro de ±50 cents do alvo. Precisão = acertos / total.

### 2.6 · Validação de ambiente na sessão

Antes do primeiro exercício do dia. Reusar `ambiente.ts` da Fase 1.
Não repetir a cada exercício — irrita.

### 2.7 · Aquecimento travado

O primeiro exercício da sessão tem `obrigatorio: true` e não pode ser pulado.
Requisito da Laury: risco de lesão.

### 2.8 · Tela de resultado

Precisão, duração, estrelas, XP. Mensagem interpretativa por faixa de precisão.
Botões: próximo exercício (primário) e repetir.

### 2.9 · Progressão automática

Ao terminar, já carrega o próximo da sessão. Nunca voltar para tela vazia.
Ao terminar o último, tela de conclusão do dia.

---

## Fase 3 — Currículo real

**Bloqueado por `CURRICULO-LAURY.md` preenchido.**

### 3.1 · Modelar exercícios

`src/curriculo/exercicios.ts` — array de `Exercicio` com o conteúdo da Laury.
Nada inventado. Onde faltar, `// TODO: pendente com a Laury`.

### 3.2 · Trilhas por tipo vocal

`src/curriculo/trilhas.ts`. Depende da resposta dela à pergunta 3 da Parte 2:
se a diferença entre tipos vocais é só a faixa de notas, resolve-se com matemática.
Se forem exercícios diferentes, precisa de conteúdo por tipo.

### 3.3 · Lógica de dia N

`src/curriculo/dia.ts` — quais exercícios aparecem hoje, dado o dia da jornada e o
perfil.

### 3.4 · Revisão de linguagem

A Laury revisa todo texto de saúde vocal e treino antes de qualquer usuário real.
Checar contra a seção 10 do `CLAUDE.md`.

---

## Fase 4 — Repertório para o palco

### 4.1 · Campo de tom por música

A dor mais clara e mais simples. Campo de texto livre ou seletor de tom.

### 4.2 · Modo Performance

Tela de palco. Fundo preto, letra grande, tom visível no canto.
`screen.orientation`, wake lock para a tela não apagar, brilho máximo.
Navegação por toque grande ou swipe — o cantor está com microfone na mão.

Nenhum app brasileiro faz isso bem. Pode ser o que justifica a assinatura.

### 4.3 · Duração estimada do show

3,5 a 4 min por música. Mostrar total e faltante por bloco.

### 4.4 · Músicas de reserva

Bloco separado de coringas, para pedido do público. A Laury explicou que cantores
sempre levam extra.

### 4.5 · Marcador "preciso ensaiar"

Flag por música dentro do projeto.

### 4.6 · Exportar PDF

Repertório com tom, BPM e ordem, para mandar para a banda.

### 4.7 · Duplicar projeto

"Quero um show parecido com o da semana passada."

---

## Fase 5 — Ear training

### 5.1 · Motor de minigame

Estrutura comum aos cinco desafios: pergunta → resposta → feedback imediato → próximo.

### 5.2 · Os cinco desafios

- Iguais ou diferentes
- Reproduza cantando (usa o analisador de pitch)
- Qual nota mudou
- Identifique a tecla
- Ascendente ou descendente

### 5.3 · Dificuldade progressiva

2 notas → 3 → intervalos maiores → escalas → trechos melódicos.

### 5.4 · Desafios a partir do repertório

O diferencial. Extrair intervalos das músicas que o cantor tem no projeto, via
Spotify, e gerar desafio com elas. Nenhum concorrente faz.

---

## Fase 6 — Retenção

### 6.1 · XP e nível com regra real
### 6.2 · Streak de dias
### 6.3 · Conquistas com condição de desbloqueio
### 6.4 · Relatório semanal interpretativo

Não só número. "Sua estabilidade caiu acima de F#4", "sua extensão aumentou 2
semitons". Precisa de histórico acumulado para funcionar.

---

## Dívida técnica conhecida

| O quê | Onde | Gravidade |
|---|---|---|
| Chave YouTube exposta em chat | secrets | alta |
| Login sem autenticação real, dados só em `localStorage` | todo o app | alta |
| Diário de Treino sem lógica real | UI pronta, dados fixos | média |
| Evolução com dados zerados | UI pronta, sem persistência | média |
| Design nunca validado | todo o app | média |
| 5 vídeos do Vocal Coach não analisados | — | baixa |
| Nenhum cantor real validou o produto | — | alta (produto) |
