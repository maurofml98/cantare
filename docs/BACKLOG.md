# Backlog

Tarefas concretas. Cada uma é executável por conta própria — dá para pedir ao Claude
Code uma por vez sem precisar explicar contexto.

Ordenadas por fase. Ver `ROADMAP.md` para o porquê de cada fase.

**Reordenado em 23/09/2026** com a especificação da aba Treinos da Laury (seção 13
do `CLAUDE.md`). O antigo "Fase 3 — Currículo real / lógica de dia N" foi
substituído pelos lotes de Treinos; o Diário como sequência fixa não é mais o alvo.

---

## Fase 0 — Fundação

### 0.1 · Rotacionar a chave do YouTube exposta

Uma chave de API do Google foi colada em chat durante o desenvolvimento. Deve ser
considerada comprometida.

```
1. console.cloud.google.com → APIs e Serviços → Credenciais
2. Excluir a chave antiga
3. Não criar nova — a integração foi abandonada (0.2)
```

### 0.2 · Remover código da integração YouTube — concluído

### 0.3 · Auditar IDs de playlist do Spotify — concluído

Os 20 IDs deram 404 (14/09/2026). Desde novembro de 2024 o Spotify nega a apps
novos playlists editoriais, e `/playlists/{id}/tracks` dá 403 até em playlist de
usuário. Trocados por `/v1/search?type=track`. Ver `ARQUITETURA.md`, seção Spotify.

### 0.4 · Tratar falha de playlist — concluído

### 0.5 · Segredos fora do repositório — concluído

### 0.6 · Desacoplar o `@lovable.dev/vite-tanstack-config`

O build depende de um preset de config do Lovable (devDependency). Isso prende o
projeto à plataforma de origem e esconde a configuração real do Vite/TanStack Start/
Nitro.

- Ver o que o preset configura hoje (plugins, SSR, Nitro, aliases)
- Replicar explicitamente no `vite.config.ts`
- Remover a dependência e confirmar `dev` e `build` funcionando

### 0.7 · Autenticação real e persistência fora do `localStorage`

Hoje o login aceita qualquer email/senha e grava o usuário em `localStorage`. Projetos,
perfil vocal, recordes e histórico também vivem só no navegador — trocar de aparelho
ou limpar dados apaga tudo. Com recordes e metas por exercício (Fase 1), a perda
passa a doer mais.

- Escolher provedor de auth e banco
- Migrar os dados existentes de `localStorage` no primeiro login
- Perfil vocal é dado biométrico (LGPD): consentimento, criptografia, opção de
  deletar — ver seção 10 do `CLAUDE.md`

---

## Fase 1 — Motor de treino e detecção

### 1.1 · Definir os tipos

`src/motor/tipos.ts` com os schemas de `ARQUITETURA.md`, revisados para a
especificação:

- `Objetivo`: `respiracao | flexibilidade | firmeza | ressonancia | articulacao`
- `TipoAnalise`: `pitch | duracao | pulsos | intensidade | leitura`
- `Exercicio`: textos curtos do passo 1, demonstração do passo 2, modelo auditivo
  opcional do passo 3, `tipoAnalise`, sequência de metas, lembretes visuais
- As etapas antigas do Vocal Coach (coordenação, afinação, voz mista) saem do tipo

### 1.2 · Motor nos 8 passos

Uma tela, oito estados, na ordem da seção 09 do PDF:

```
o que fazer → como fazer → modelo → executar → feedback → resultado → meta → evolução
```

"Modelo" é pulado quando o exercício não tem referência auditiva. Não criar tela
por exercício. Se aparecer `ExercicioRespiracao.tsx` no projeto, está errado.

### 1.3 · Corrigir duração de emissão contínua — bug do microfone

`src/motor/analise/duracao.ts`. Usado por S sustentado, controle com "X",
Espaguete + VU e mastigação + HUMMM.

- "S" e "X" são **surdos**: autocorrelação não acha pitch. Detectar por energia
  (RMS, idealmente em banda alta de chiado), não pelo detector de pitch
- Quebra = energia abaixo do gate por mais de 250ms
- Gate calibrado pelo ruído medido na validação de ambiente, não fixo — chiado e
  ruído de fundo se parecem
- Resultado: "sustentou 11 de 12 segundos". Sem punição, repetição imediata

### 1.4 · Analisador de pulsos

`src/motor/analise/pulsos.ts`. Usado por S pulsado, Finger kazoo, Som de sapo,
humming e, depois, o jogo de palavra + ritmo.

- Detectar ataques no envelope de energia (subida rápida após vale)
- Saída: contagem e timestamps de cada ataque
- Regularidade = variação do intervalo entre ataques ("pulsos com regularidade" é
  o que ela pede no S pulsado)

### 1.5 · Analisador de intensidade relativa

`src/motor/analise/intensidade.ts`. Usado pela messa di voce.

- Curva de RMS normalizada pelo início da emissão — nunca dB absoluto
- Visual: crescimento da emissão na tela
- **Aguarda a Laury:** se "escala crescente" for altura, o exercício usa pitch

### 1.6 · Cronômetro de leitura

Início/fim por toque; opcionalmente início automático por detecção de voz. Trivial.

### 1.7 · Validação de ambiente na sessão

Antes do primeiro exercício do dia. Reusar `ambiente.ts`. Não repetir a cada
exercício — irrita. Guardar o nível de ruído medido para calibrar 1.3 e 1.4.

### 1.8 · Aquecimento travado — manter

Já implementado. A especificação não menciona aquecimento; até a Laury responder,
a regra da seção 10 do `CLAUDE.md` prevalece e nenhum treino abre sem aquecer.

### 1.9 · Meta progressiva e recorde pessoal

Passos 7 e 8. Por exercício: meta atual, próxima meta, recorde, histórico de
tentativas. Bater a meta avança para a próxima. S sustentado: 8 → 10 → 12 → 15s e
além (25/09/2026: o teto caiu, a Laury chegou a 21s; degraus acima de 15s pendentes,
no topo vale superar o recorde). Numa sessão o tempo sobe, faz pico e cai por
cansaço — a queda não é erro.

---

## Fase 2 — Treinos, lote A: sem pitch

### 2.1 · Aba Treinos

Rota nova com 5 cards de objetivo. Substitui o Diário de Treino na navegação.
Cards sem emoji e sem ícone de biblioteca até a Laury confirmar (contradição 3).

### 2.2 · Respiração

- S sustentado — `duracao`, meta 8/10/12/15s e além (degraus pendentes)
- S pulsado — `pulsos` · **meta de repetições pendente com a Laury**
- Controle respiratório com "X" — `duracao` crescente por repetição ·
  **progressão pendente**
- Ilustração da inspiração: inspirar → abdômen firme → emitir. Lembrete "relaxe os
  ombros"

### 2.3 · Articulação e Dicção

- 6 trava-línguas do PDF, `leitura`, recorde de tempo
- Texto na tela durante a execução; lembretes "abra mais a boca", "articule com
  precisão", "mantenha a clareza"
- **Não pontuar clareza.** Só tempo. Ver seção 13 do `CLAUDE.md`
- **Tempo-meta pendente com a Laury**

---

## Fase 3 — Perfil vocal

### 3.1 · Portar o teste de extensão — concluído

### 3.2 · Inserir no fluxo de cadastro

Depois do cadastro, antes de chegar na home. Com opção de pular — quem pula faz o
lote A normalmente e vê o lote B pedindo o teste.

### 3.3 · Persistir perfil vocal

```ts
type PerfilVocal = {
  midiMin: number;
  midiMax: number;
  tipoEstimado: TipoVocal;
  medidoEm: string;
  qualidadeMedicao: 'boa' | 'media' | 'ruim';
}
```

Guardar **histórico**, não só o último registro.

### 3.4 · Refazer o teste

Botão acessível a qualquer momento. Nunca tratar a classificação como definitiva.

### 3.5 · Resolver alvos relativos

`src/motor/alvos.ts`: `resolverAlvos(exercicio, perfil) → { midi, duracaoSeg }[]`.
Base = `perfil.midiMin + 3`. Teto = `perfil.midiMax - 2`. Se passar do teto,
comprimir a amplitude. **Requisito clínico, não otimização.** Margem ainda não
validada pela Laury (Parte 5 do `CURRICULO-LAURY.md`).

---

## Fase 4 — Treinos, lote B: com pitch

**Bloqueado por respostas da Laury** — ver contradições 2, 4, 6 e 7 na seção 13 do
`CLAUDE.md`.

### 4.1 · Trilha de pitch com pista auditiva

Trilha de notas-alvo + marcador da voz ao vivo (referência: `Ladder` do teste
vocal). Modelo tocado antes (pista auditiva). Acerto = ±50 cents.
Vibração de lábios pode instabilizar a leitura — testar com voz real.

### 4.2 · Flexibilidade

Escala em vibração de lábios, com vogais (mostrar A-E-I-O-U atual), com "Z".
**Pendente:** desenho da escala.

### 4.3 · Firmeza Vocal

Espaguete + VU (`duracao` + pitch grave), Finger kazoo (`pulsos` + pitch grave),
Som de sapo (`pulsos`). Referência "voz de radialista", contagem de inspiração e de
emissão, loop demonstrativo.

### 4.4 · Ressonância

Mastigação + HUMMM (`duracao`), messa di voce (`intensidade` ou pitch — pendente),
humming grave → agudo (`pulsos` + pitch).

### 4.5 · Ilustrações demonstrativas

Bochechas infladas vs. não, cara de nojo, lábios em bico, mastigação. Só instrução.
**Tom "divertido/cômico" pendente de alinhamento** — depende também das referências
visuais (0 — Fundação).

### 4.6 · Revisão de linguagem

A Laury revisa todo texto de treino antes de qualquer usuário real. Checar contra a
seção 10 do `CLAUDE.md`.

---

## Fase 5 — Evolução e retenção

### 5.1 · Evolução com dados reais

A partir dos recordes e históricos da 1.9.

### 5.2 · XP e nível com regra real

Só em treino. Aquecimento não tem nível (correção da Laury).

### 5.3 · Streak e desafios diários
### 5.4 · Conquistas com condição de desbloqueio
### 5.5 · Relatório semanal interpretativo

Não só número. Termina sempre com orientação de procurar profissional em caso de
dor, rouquidão ou desconforto. Sem percentil contra outros usuários.

---

## Fase 6 — Repertório para o palco

Concluídos: campo de tom, Modo Performance, duração estimada, reservas, exportar
PDF, duplicar projeto.

### 6.1 · Marcador "preciso ensaiar"

Flag por música dentro do projeto.

---

## Fase 7 — Jogos: ritmo e ear training

### 7.1 · Palavra + ritmo

Proposta da Laury (seção 08 do PDF): batida → imagem → pronunciar no tempo →
acerto, velocidade crescente. Reusa `pulsos.ts` comparando o ataque com a batida.
Não avalia a palavra, só o tempo.

### 7.2 · Motor de minigame de ear training

Pergunta → resposta → feedback imediato → próximo.

### 7.3 · Os cinco desafios

Iguais ou diferentes · reproduza cantando · qual nota mudou · identifique a tecla ·
ascendente ou descendente.

### 7.4 · Desafios a partir do repertório

O diferencial. Nenhum concorrente faz.

---

## Dívida técnica conhecida

| O quê | Onde | Gravidade |
|---|---|---|
| Chave YouTube exposta em chat | secrets | alta |
| Duração de emissão com bug do microfone | `src/motor/analise` | alta (bloqueia Fase 2) |
| Login sem autenticação real, dados só em `localStorage` | todo o app | alta |
| Diário de Treino sem lógica real — será substituído pela aba Treinos | `_app.diario.*`, `diario.*` | média |
| Evolução com dados zerados | UI pronta, sem persistência | média |
| Design nunca validado | todo o app | média |
| 5 vídeos do Vocal Coach não analisados | — | baixa |
| Nenhum cantor real validou o produto | — | alta (produto) |
| **Base de locais só no aparelho:** o local do show (sugestão do OpenStreetMap via Photon, 25/09/2026) fica no `localStorage` de cada cantor. A "base de onde os cantores tocam" que a Laury viu de valor só existe quando houver servidor para juntar os dados — com consentimento (LGPD) e atribuição ao OpenStreetMap (ODbL). Mesma pendência da métrica de uso (`CLAUDE.md`, seção 14, contradição 5) | `lib/repertoire/places.ts`, `types.ts` (`VenuePlace`) | média (produto) |
| **Lint quebrado:** `bun run lint` dá ~17 mil erros (25/09/2026), quase todos de formatação do prettier; o código nunca foi formatado por ele. Sem lint confiável, erro real (hook com dependência faltando, variável morta) passa despercebido. Decidir: formatar o projeto inteiro de uma vez ou tirar o prettier do eslint, e conferir se `.output/` entra na varredura | `eslint.config`, todo o `src` | média (rede de segurança perdida) |
