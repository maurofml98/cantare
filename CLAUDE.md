# Cantare

Plataforma para cantores brasileiros. Une treino vocal com análise de áudio, saúde
vocal com curadoria clínica, e gestão de repertório para shows.

Este arquivo é o contexto permanente do projeto. Leia antes de qualquer alteração.

---

## 1. As pessoas

**Laury** — fonoaudióloga especializada em voz artística. É a autoridade técnica e a
face pública do produto. Trabalha com cantores profissionais, entre eles Murilo
(sertanejo). A ideia original é dela. Sem o conteúdo clínico que só ela pode validar,
o produto é uma casca vazia.

**Mauro** — desenvolvimento e produto. Tem experiência em sistemas, não em música.
Não sabe teoria musical — qualquer decisão musical precisa ser explicada ou validada
com a Laury.

**Murilo** — cantor, cliente da Laury. Investidor em potencial. Tem dinheiro e rosto
no mercado, já demonstrou interesse em algo parecido no passado. A estratégia é
apresentar a ele uma base pronta, não uma ideia solta. Ainda não foi abordado.

---

## 2. De onde veio

A Laury já quis fazer isso como curso, e desistiu — não se identifica com o formato
nem com o marketing de mentoria. Depois pensou em app, conversou com desenvolvedores
e foi desencorajada pelo custo. Retomou a ideia quando percebeu que IA poderia
baratear a parte difícil.

Existe um documento estratégico anterior (`Projeto_Laury_Fono.pdf`) escrito sob o nome
provisório "VocalAI" — 16 capítulos cobrindo mercado, monetização, roadmap em 7 fases.
Útil como referência de visão, mas superdimensionado. O nome foi trocado para
**Cantare**.

---

## 3. O que a Laury pediu — reunião inicial

Transcrição resumida do que ela definiu como essencial:

**Público-alvo.** O cantor de barzinho, de evento e de igreja. Ela foi enfática:
"tem gente vendendo carro para gravar um DVD, gente se enfiando em dívida". É um
nicho enorme com pouco poder aquisitivo. Quem tem dinheiro contrata a Laury
diretamente — o app existe para quem não consegue.

**Plataforma.** Celular. "Todo mundo tem um celular hoje, mesmo que seja um Android
bem simples. Esse aplicativo tem que rodar lá."

**Estrutura do repertório.** Projetos → dentro do projeto, repertórios.
Exemplo: "Projeto Bar do Zé, 15/03" contém o repertório daquela noite. Um cantor de
barzinho também canta em casamento — cada contexto vira um projeto.

**Blocos de show.** Todo show, grande ou pequeno, é pensado em blocos:

```
abertura (3-4 músicas) → conversa com o público →
bloco temático (ex: axé) → conversa →
modão / potpourri (~5 músicas) →
volta ao sertanejo universitário →
encerramento energético
```

Cantores selecionam repertório com música extra, porque mudam na hora conforme
sentem o público.

**Saúde vocal.** Ela quer entregar planilhas de aquecimento e desaquecimento —
o nível mais básico e seguro. Formato: no máximo 4 exercícios por planilha, cada um
com série e repetição, explicados por desenho ou loop animado. **Texto quebra o
negócio** — precisa ser visual.

Exemplo que ela deu:
```
1. Vibração de língua com inalação — 3 séries de 5 repetições
2. Espaguete com sopro sonorizado na mão — 2 séries de 5 repetições
3. Mastigação exagerada (soltar musculatura do rosto) — 3 séries de 5
4. Testar a voz em escala
```

**Correção importante dela:** aquecimento não tem *níveis*. Nível implica aumento de
intensidade, e aquecimento não aumenta intensidade — é higiene, "igual escovar o
dente". O que existe são **estilos** de aquecimento: para agudo, para grave, para dia
de gravação, para dicção, para repertório intenso.

**Ética.** Sempre com "procure um profissional". Nunca diagnóstico. Ela é a guardiã
ética do produto e isso não é negociável.

---

## 4. A referência que mudou tudo — Vocal Coach

Meses depois, a Laury descobriu o app **Vocal Coach** e mandou ~10 vídeos narrados.
Analisamos 5. É a referência central do produto hoje. A visão declarada virou:
**Vocal Coach + Cifra Club, melhorado e brasileiro.**

### O que ela destacou

**Onboarding com teste de extensão vocal.** No primeiro login, antes de qualquer
coisa, o app pede o microfone e mede a voz. Classifica (no caso dela, contralto,
C#3–A5). A partir daí *todos* os exercícios são montados dentro dessa faixa. Não se
repete — é só no cadastro.

**Ela mesma relatou o problema:** fez o teste em dois dias diferentes. Um dia deu
soprano, outro contralto. A diferença foi ruído ambiente. Isso é crítico e o Cantare
precisa tratar.

**Aquecimento obrigatório antes do treino.** Ela reforçou que isso "nos respalda
eticamente" — não se começa treino vocal sem aquecer, o risco de lesão é grande.

**Exercícios personalizados por tipo vocal.** O exercício de hoje é diferente do de
ontem, e diferente conforme a classificação.

### O que as análises dos vídeos trouxeram

**Feedback visual em tempo real.** Uma trilha de notas-alvo e um ponto que representa
a nota que você está produzindo. Acima da linha, abaixo, ou em cima. Correção
instantânea sem esperar o fim.

**Representação corporal.** Wireframe de corpo humano com indicações Heady/Light,
Mixy/Balanced, Chesty/Heavy. Orientação visual de onde a ressonância deve acontecer —
não mede isso de fato.

**Validação de ambiente antes de começar.** O app checa ruído e bloqueia se estiver
ruim: "Ruído de fundo excessivo" com opção de continuar ou refazer. Considerado
obrigatório para o Cantare.

**Motor único de treino.** Todos os exercícios reusam a mesma interface — muda só o
objetivo técnico, as notas-alvo e os critérios. Decisão de arquitetura importante:
não criar telas separadas por exercício.

**Currículo progressivo.** Aquecimento → Respiração → Coordenação → Flexibilidade →
Afinação → Ressonância → Voz mista → Belting/Resistência → Desaquecimento.
Sequência, não coleção aleatória.

**Progressão automática.** Terminou um exercício, já direciona para o próximo.
Nunca tela vazia. Reduz abandono.

**Exercício de respiração com feedback.** Sustentar "SSS" por 30s, o sistema detecta
quando você quebra e informa: "quebrou em 22 de 30 segundos". Sem punição —
"tentar novamente" imediato.

**Ear training em minigames.** Módulo separado de percepção musical:
iguais ou diferentes, reproduza a sequência cantando, qual nota mudou, identifique a
tecla, ascendente ou descendente.

**Gamificação.** Nota, estrelas, precisão, percentil, dia da jornada, % de conclusão,
conquistas, streak.

### O diferencial que ninguém tem

Ear training usando as músicas do repertório real do cantor, via Spotify. Treinar os
intervalos de uma música que ele vai cantar sexta-feira, em vez de escalas abstratas.
Isso liga os dois lados do produto e nenhum concorrente faz.

---

## 5. Posicionamento competitivo

|                            | Vocal Coach | Cifra Club | Cantare |
|----------------------------|-------------|------------|---------|
| Treino vocal por microfone | sim         | não        | sim     |
| Saúde vocal clínica        | não         | não        | sim     |
| Repertório de show         | não         | parcial    | sim     |
| Tendências / Spotify       | não         | não        | sim     |
| Foco no cantor brasileiro  | não         | sim        | sim     |
| Modo palco                 | não         | não        | planejado |

Cifra Club tem 400 mil cifras e transposição, mas é feito para instrumentistas.
OnSong é só iOS, MobileSheets é só Android, nenhum dos dois é brasileiro.

O espaço vago: cantor + saúde vocal + Brasil.

---

## 6. Estado atual do código

**Onde está:** projeto no Lovable — `blank-canvas-spark-4329.lovable.app`
**Para onde vai:** GitHub → VSCode → Claude Code no terminal
**Deploy:** Vercel, automático a cada push no `main` — `https://cantare-olive.vercel.app`.
Teste de microfone com voz real: `/lab/microfone` (sem link no app, `noindex`, sem
proteção — decisão de 23/09/2026)

**Stack:** TanStack Start (React, SSR, servidor Nitro) + Vite + Tailwind.
Não existe banco de dados: projetos, perfil vocal e usuário ficam todos em
`localStorage`. Secrets (ex.: Spotify) são lidos só no servidor, via `createServerFn`
e `process.env`, sem prefixo `VITE_`, e nunca chegam ao navegador.

### O que existe e funciona

- Login/cadastro **de fachada** — grava o usuário em `localStorage` e aceita qualquer
  email/senha. Não existe autenticação real.
- **Repertório** — projetos, tipos de evento, lista de músicas, abas Repertório/Blocos
- **Buscar músicas** (antiga Tendências) — dentro do projeto: categoria →
  subcategoria (busca pré-definida) ou busca livre → seleção de faixas → adicionar
  ao repertório. Não é curadoria nem "em alta": é busca de faixas do Spotify
- **Saúde Vocal** — 6 cards de aquecimento por situação, tela de exercícios
- **Diário de Treino** — Dia 1, círculo de progresso, lista de 7 exercícios (conteúdo
  é placeholder). **Estrutura substituída pela aba Treinos — ver seção 13**
- **Evolução** — nível, XP, streak, gráfico semanal, 6 conquistas (dados zerados)
- Layout web com sidebar + versão mobile com bottom nav

### O que é fachada

Diário de Treino e Evolução têm a interface pronta mas **nenhuma lógica real por
trás**. Os 7 exercícios são texto fixo. XP não acumula. Nenhum exercício executa de
fato.

---

## 7. Integrações

### Spotify — funciona só a busca de faixas

Client Credentials Flow, sem login do usuário.

```
POST https://accounts.spotify.com/api/token
  grant_type=client_credentials
Secrets: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET
```

App registrado no Spotify for Developers.
Redirect URI: `https://blank-canvas-spark-4329.lovable.app`
(localhost não é aceito pelo Spotify desde abril 2025 — só HTTPS ou IP de loopback
explícito.)

**Correção:** a lista anterior de playlists "oficiais confirmadas e estáveis" (Top 50
Brasil, Top Songs Brasil) estava errada — nunca foi verificada com as credenciais
deste app. Testado em 14/09/2026:

- Desde novembro de 2024 o Spotify nega a apps novos o acesso a playlists editoriais
  e algorítmicas (`37i9dQZF1…`, `37i9dQZEVXb…`) e responde **404**, mesmo com ID
  válido. Os 20 IDs hardcoded deram 404.
- `/v1/playlists/{id}/tracks` dá **403** até em playlist de usuário comum.
- `/v1/search?type=playlist` responde 200, mas com itens `null` no meio e sem as
  faixas utilizáveis.
- **Só `/v1/search?type=track` funciona.** Limite máximo abaixo de 20:
  `limit=10` funciona, `limit=20` dá 400 "Invalid limit".

Endpoint usado: `/v1/search?type=track&market=BR&limit=10`. Não existe "em alta" ou
"viral" acessível — não prometer isso na interface. O Spotify também não informa o
tom da música: ele é preenchido pelo cantor.

### YouTube — abandonado

Chave criada, API ativada, integração implementada. **Descartada.**

Motivo: o YouTube não tem endpoint de "viral" ou "em alta". `order=viewCount` traz
vídeos com muitas views históricas, não o que está bombando. Além disso, em fevereiro
de 2026 o Google removeu endpoints relevantes. A chave `YOUTUBE_API_KEY` ainda existe
nos secrets mas não é usada.

---

## 8. O que deu trabalho e o que não resolvemos

Seção honesta. Ler antes de repetir os mesmos erros.

### Design — nunca convergiu

Foram **mais de cinco rodadas** de redesign completo. Todas rejeitadas com alguma
variação de "está com cara de IA". Tentamos:

1. Dark + dourado com ícones Tabler → genérico
2. Cormorant Garamond + DM Sans + remoção de ícones → melhor, ainda insuficiente
3. Ilustrações SVG conceituais, algarismos romanos no menu → ficou vazio e frio
4. Glassmorphism + orbs + partículas flutuantes + 5 animações → não chegou a ser
   avaliado

**Diagnóstico:** o problema nunca foi a execução. Foi a ausência de um alvo visual
concreto. Descrever estilo em palavras ("premium", "luxuoso", "humanizado") não
converge. Foram levantadas duas referências (um concept de Apple Music e o app de
sono Somnia) e buscas de Pinterest, mas **as referências finais nunca foram
escolhidas**.

**Regra para o futuro:** não iniciar rodada de design sem 3 a 5 imagens de referência
definidas. Sem isso é desperdício de tempo.

### Chave de API exposta

Uma chave do YouTube foi colada no chat. Foi avisado, mas **não há confirmação de que
ela foi rotacionada**. Antes de qualquer push público: revogar e gerar nova.
Conferir que `.env` está no `.gitignore`.

### IDs de playlist — removidos

O Lovable implementou "curadoria de IDs fixos" de playlists supostamente editoriais
(Esquenta Sertanejo, Louvor & Adoração etc.). Auditados em 14/09/2026: **os 20 davam
404** — parte era ID inventado, e o resto é inacessível pela restrição do Spotify
(ver seção 7). Foram substituídos por buscas de faixa. Não reintroduzir IDs de
playlist.

### O bloqueio real: conteúdo

**Nada disso destrava sem a Laury.** O currículo de exercícios por tipo vocal
(soprano, mezzo, contralto, tenor, barítono, baixo) não existe. Sem ele, o Diário de
Treino é uma casca. Nenhum modelo de IA resolve isso — é conhecimento clínico que só
ela pode produzir e assinar.

**Atualização 22/09/2026:** ela entregou a especificação da aba Treinos (seção 13):
5 objetivos × 3 exercícios. Destrava o motor, mas não fecha tudo.

**Pendente com ela:**
- Exercícios de aquecimento por estilo (agudo, grave, gravação, dicção, pós-show)
  — e onde o aquecimento entra no modelo de academia (seção 13, contradição 1)
- Metas numéricas de cada exercício (só o S sustentado tem: 8/10/12/15s)
- Desenho das escalas (quantas notas, quais intervalos)
- O que muda entre um tipo vocal e outro na prática

### Outras pendências

- Os últimos 5 vídeos do Vocal Coach não foram analisados
- Modelo de negócio e sociedade não definidos
- Murilo não foi abordado
- Nenhum cantor real validou o produto ainda (o documento original recomendava
  entrevistar 10–20 antes de escrever código — não foi feito)

---

## 9. Decisões técnicas

### Detecção de pitch

Autocorrelação com Web Audio API, **100% client-side**. Sem servidor, sem custo,
sem API. É a mesma técnica de afinadores online.

```
getUserMedia → AudioContext → AnalyserNode (fftSize 2048)
→ getFloatTimeDomainData → autocorrelação → frequência → nota MIDI
```

Parâmetros usados na implementação de referência:
- Gate de RMS: 0.009 (abaixo disso é silêncio)
- Faixa de busca: 65 Hz a 1100 Hz
- Gate de clareza: 0.55
- Correção de erro de oitava: prefere pico anterior com ≥86% da correlação máxima
- Interpolação parabólica para refinar o lag
- Estabilidade: 8+ leituras em 420ms dentro de ±0.7 semitom antes de registrar

`getUserMedia` precisa de `echoCancellation`, `noiseSuppression` e `autoGainControl`
em **false** — os filtros do navegador destroem a análise de pitch.

Conversão:
```js
midi = 69 + 12 * Math.log2(freq / 440)
```

### Classificação de tipo vocal

Faixas em número MIDI:

| Tipo          | Baixa | Alta | MIDI    |
|---------------|-------|------|---------|
| Baixo         | E2    | E4   | 40–64   |
| Barítono      | A2    | A4   | 45–69   |
| Tenor         | C3    | C5   | 48–72   |
| Contralto     | F3    | F5   | 53–77   |
| Mezzo-soprano | A3    | A5   | 57–81   |
| Soprano       | C4    | C6   | 60–84   |

Método: sobreposição sobre união, penalizada pela distância entre os centros.

**Tratar como estimativa, nunca como definitivo.** Permitir refazer sempre.
A própria Laury teve resultado diferente em dias diferentes.

### Limitações conhecidas da detecção

- Voz grave com microfone ruim → erro de oitava
- Vibrato forte → dificulta a estabilização
- Ruído ambiente → resultado não confiável (daí a validação obrigatória)
- **iOS Safari ignora parte do `getUserMedia`** (teste real de 23/09/2026, iPhone):
  `getSettings()` só devolve `echoCancellation`; `noiseSuppression` e
  `autoGainControl` nem aparecem, então não há como confirmar que foram desligados.
  O piso de ruído calibrado saiu entre -82 e -101 dB — impossível numa sala real:
  é um gate do iOS zerando o silêncio. A calibração do ruído da sala fica
  artificialmente baixa. No teste não atrapalhou (o "S" ficou ~50 dB acima), mas
  em ambiente ruidoso o gate pode cortar início/fim de emissões fracas ou deixar
  o ruído passar como voz. Validar em sala barulhenta antes de confiar no iOS

### Identidade visual (última definida, não validada)

```
Fundo base       #07080A
Fundo secundário #0D0F12
Card             rgba(255,255,255,0.03)
Borda            rgba(255,255,255,0.06)
Dourado          #B8955A   (envelhecido, não amarelo)
Texto            #E8E4DC   (marfim, não branco puro)
Texto secundário rgba(232,228,220,0.4)
```

Tipografia: **Newsreader** (títulos, números grandes, 300/600; substituiu a Cormorant
Garamond, que renderiza o circunflexo torto — ver `docs/DESIGN.md`) +
**DM Sans** (interface, 300/400/500).

**Tokens reais do CSS (corrigido em 14/09/2026):** o `src/index.css` — o único CSS
carregado pelo `__root.tsx` — definia `--primary: #8B5CF6` (**roxo**), `--accent: #F43F5E`
(rosa) e `--radius: 1.5rem`. Isso vazava para todo componente shadcn (`bg-primary`,
anéis de foco, item ativo da navegação mobile), por isso o roxo "proibido" aparecia no
app. Hoje primary é o dourado e os tokens de cor e movimento vivem só no `index.css`.
O `src/styles.css` não é carregado; não editar tokens lá.

Proibições acumuladas ao longo do projeto:
- Roxo, lilás, neon — descartados definitivamente
- Ícone dentro de círculo colorido — principal marcador de "app genérico"
- Pill colorida no item ativo do menu
- Ícones de biblioteca em cards de conteúdo
- Emojis
- Gradientes coloridos óbvios

---

## 10. Restrições éticas — inegociáveis

Estas não são preferências. São o que protege a Laury profissionalmente e o produto
juridicamente.

1. **Nunca "diagnóstico", "laudo" ou "avaliação clínica".** Sempre "análise de
   performance", "relatório de acompanhamento", "sinais de atenção".
2. **Aquecimento antes de qualquer treino vocal.** Risco de lesão.
3. **Todo relatório termina com orientação de procurar profissional** em caso de dor,
   rouquidão ou desconforto.
4. **Nenhuma promessa de cura, tratamento ou recuperação vocal** em marketing.
5. **Sem clonagem vocal.** Qualquer função de IA aplicada só à voz do próprio usuário
   autenticado.
6. **Dados de voz são biométricos** — LGPD. Consentimento explícito, criptografia,
   opção de deletar. O processamento client-side ajuda: o áudio não sai do aparelho.
7. **Áudio processado localmente sempre que possível.** Declarar isso ao usuário.

---

## 11. Próximos passos

**Bloqueadores (nada avança sem isso):**
1. ~~Currículo de exercícios com a Laury~~ — estrutura entregue (seção 13); faltam
   metas numéricas, escalas e a resposta sobre aquecimento
2. Rotacionar a chave de API exposta
3. Escolher 3–5 referências visuais concretas

**Técnico:**
4. Migrar o código do Lovable para GitHub e rodar local
5. Integrar o teste de extensão vocal (já implementado isoladamente) no onboarding
6. Construir o motor único de treino nos 8 passos da seção 13
7. ~~Auditar os IDs de playlist do Spotify um por um~~ — feito, IDs removidos
   (seção 7)

**Produto:**
8. Analisar os 5 vídeos restantes do Vocal Coach
9. Validar com 10–20 cantores reais antes de investir mais
10. Definir sociedade e abordar o Murilo com a base pronta

---

## 12. Como trabalhar neste projeto

- **Conteúdo clínico vem da Laury.** Não inventar exercício vocal, série, repetição
  ou orientação técnica. Se faltar, deixar placeholder marcado e perguntar.
- **Motor único.** Exercício novo é configuração (objetivo, duração, notas-alvo,
  critério), não tela nova.
- **Mobile importa mais que desktop.** O público-alvo usa Android simples.
- **Menos texto.** A Laury foi explícita: "texto vai quebrar o negócio". Visual e
  animação explicam melhor que parágrafo.
- **Estado vazio é convite, não erro.** O cantor sem projeto precisa saber o que
  fazer, não ler "sem dados".
- **Não usar linguagem clínica.** Reler a seção 10 em caso de dúvida.

---

## 13. Aba Treinos — especificação da Laury (recebida em 22/09/2026)

Fonte: `docs/laury/Especificação do app — Aba Treinos + Home.pdf` (18 páginas).
É o primeiro conteúdo clínico entregue por ela e **muda a estrutura do produto**.
Onde contradiz o que está acima, ver "Contradições em aberto" no fim desta seção —
não resolver por conta própria.

### O que muda

**O Diário de Treino como sequência fixa do dia (aquecimento → respiração →
coordenação → … → desaquecimento, herdada do Vocal Coach) está substituído.** O
modelo agora é de academia: o cantor entra em Treinos e **escolhe o objetivo** que
quer desenvolver.

```
Objetivo → Treino → Exercício → Execução → Resultado → Evolução
```

Princípio dela: o cantor deve sentir "estou treinando minha voz", não "estou
assistindo a exercícios de fonoaudiologia". Gamificação estimula evolução
**individual** — superar a própria marca, não competir com outros usuários.

### Cinco objetivos, três exercícios cada

| Objetivo | Exercícios |
|---|---|
| **Respiração** — controle e sustentação do ar | 1. S sustentado · 2. S pulsado (força vem do abdômen) · 3. Controle respiratório com "X" (mais ar e mais tempo a cada repetição; lembrete "relaxe os ombros") |
| **Flexibilidade** — mobilidade em escala | 1. Escala em vibração de lábios · 2. Escala com vogais A-E-I-O-U (mostrar a vogal atual) · 3. Escala com som de "Z" |
| **Firmeza Vocal** — voz grave, estável, "de radialista" | 1. Espaguete + "VU" grave sustentado (bochechas infladas) · 2. Finger kazoo — "VU" pulsado no grave, dedo na boca, **sem** inflar bochechas · 3. Som de sapo — "HUM" glotal e pulsado |
| **Ressonância** — sensação e projeção | 1. Alongamento de estruturas orais — mastigação exagerada com "HUMMMM" · 2. Messa di voce / slow crescendo — "cara de nojo", MM → NH → AAAH, "em escala crescente" · 3. Humming — vários "HUM" do grave ao agudo |
| **Articulação e Dicção** — clareza e velocidade | 6 trava-línguas cronometrados (texto na tela + cronômetro + meta). Modalidade futura: palavra + ritmo sobre uma batida, com velocidade crescente |

Exigências por objetivo: Respiração pede ilustração da inspiração (inspirar →
abdômen firme → emitir). Flexibilidade pede pista visual (movimento das notas),
pista auditiva (modelo da escala) e feedback de acerto/erro. Firmeza pede loop da
execução, demonstração corporal, contagem de inspiração e de emissão, e nota de
referência.

**Meta do S sustentado: 8 → 10 → 12 → 15 segundos.** Isso responde a pergunta do
teto clínico que estava aberta: o "SSS de 30s" do Vocal Coach (ver `ARQUITETURA.md`)
não é a referência — a progressão começa em 8s e o teto definido por ela é 15s.
Não subir além disso sem ela.

### Arquitetura de tela obrigatória — 8 passos (seção 09 do PDF)

Todo exercício, sem exceção, passa por:

1. **O que fazer** — explicação extremamente curta
2. **Como fazer** — demonstração visual/animada
3. **Modelo** — referência auditiva, quando houver
4. **Executar** — microfone ativo
5. **Feedback** — o app analisa a execução
6. **Resultado** — desempenho mostrado visualmente
7. **Meta** — o próximo objetivo
8. **Evolução** — registro do progresso individual

É o contrato do motor único: o componente é um só, e os 8 passos são os seus
estados. Exercício novo continua sendo configuração, não tela.

### Capacidades de detecção que os 15 exercícios exigem

| Capacidade | Usada em | Estado |
|---|---|---|
| **Altura (pitch)** | Flexibilidade 1–3; Firmeza 1–2 ("grave"); Ressonância 2–3 | **Existe**, com gate de clareza (23/09/2026: sem ele, 41/50 quadros de chiado viravam nota). Testado só com sinal sintético. Vibração de lábios pode instabilizar — testar com voz real |
| **Duração de emissão contínua** | Respiração 1 e 3; Firmeza 1; Ressonância 1 | **Implementado, não testado com voz** (`src/lib/audio/detectors.ts`). Por energia em bandas contra o ruído da sala calibrado, não gate fixo de RMS — funciona com chiado surdo e com Bluetooth cortando agudo |
| **Contagem de pulsos por ataque no envelope** | Respiração 2; Firmeza 2–3; Ressonância 3; futuro jogo palavra + ritmo (com tempo do ataque vs. batida) | **Implementado, não testado com voz** |
| **Curva de intensidade (relativa)** | Ressonância 2 (crescendo) | **Implementado, não testado com voz.** Só relativa ao início da própria emissão — microfone de celular não dá dB absoluto, e o ganho varia por aparelho |
| **Tempo de leitura** | Articulação (trava-línguas) | Implementado (modo `timer`, início/fim pela voz) |

Cada exercício declara seus modos em `src/lib/treinos/exercises.ts`. Bancada de teste com
voz real: rota `/lab/microfone` (gera relatório JSON). Limiares dos detectores são
provisórios até esse teste.

### O que NÃO é mensurável — não prometer

Isto fica como **instrução visual** (animação, lembrete), nunca como feedback,
pontuação ou acerto/erro:

- **Clareza articulatória do trava-língua.** Exigiria reconhecimento de fala em
  português, offline, no aparelho — pouco confiável e pesado para Android simples.
  O app mede **tempo**, não se a pessoa articulou bem. "Abra mais a boca" e
  "articule com precisão" são orientação, não correção
- **Expressão facial** ("cara de nojo" da messa di voce, lábios em bico)
- **Bochechas infladas ou não** (Espaguete + VU vs. Finger kazoo)
- **Abdômen firme, ombros relaxados, mastigação**
- **Qual vogal está sendo cantada** na escala com vogais — a tela mostra, não confere

### Contradições em aberto (levar à Laury antes de implementar)

1. **Aquecimento e desaquecimento não aparecem no PDF.** Era a regra ética mais
   forte dela (seção 10, item 2). O modelo de academia, onde o cantor escolhe o
   objetivo e entra direto, não diz onde o aquecimento entra. **Até ela responder,
   a seção 10 prevalece:** aquecimento travado antes de qualquer treino. Além
   disso, exercícios que ela deu antes como **aquecimento** (espaguete, mastigação
   exagerada, vibração) agora aparecem como **treino** — falta dizer se são a
   mesma coisa
2. **Tom visual.** Ela pede identidade "mais divertida", "estímulos cômicos e
   ilustrações engraçadas" na Ressonância e "representação divertida" no Som de
   sapo. O briefing de design diz "não gamificação infantil". Ela mesma limita:
   divertido dentro do exercício, interface geral "moderna, limpa", "produto
   tecnológico premium". Leitura provável: humor nas ilustrações de demonstração,
   não no chrome do app — confirmar
3. **Emoji nos cards** da barra lateral (🫁 🎵 🎙 ✨ 🗣) e "ícones intuitivos" na
   direção de design. Emoji e ícones de biblioteca em cards estão proibidos (seção
   9). Provavelmente marcador de rascunho, não pedido literal — confirmar
4. **Tipo vocal e teste de extensão não são mencionados.** O onboarding vocal era
   "o coração do produto". As escalas precisam da faixa do cantor para não forçar,
   então o perfil vocal continua necessário — mas ela não diz se o exercício muda
   por tipo vocal (pergunta 3 da Parte 2 do `CURRICULO-LAURY.md` segue aberta)
5. **O currículo herdado do Vocal Coach sumiu.** Afinação, coordenação, voz mista
   e belting/resistência não estão nos cinco objetivos. Não há ordem entre
   objetivos nem "dia N"
6. **Messa di voce "em escala crescente"** é ambíguo: crescendo de intensidade na
   mesma nota (sentido clássico; "mostrar o crescimento da emissão" sugere isso)
   ou escala ascendente? Define se o analisador é intensidade ou pitch
7. **Faltam números.** Só o S sustentado tem meta. Pulsos-meta, tempo-meta dos
   trava-línguas, desenho da escala (quantas notas, quais intervalos), repetições
   — nada definido. Não inventar (seção 12)
8. **"Níveis de dificuldade"** está na lista de funcionalidades. Ela corrigiu que
   aquecimento não tem nível; para treino faz sentido, mas não pode vazar para o
   aquecimento
