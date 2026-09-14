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

**Stack:** React + Vite + Tailwind. Backend/secrets via Lovable Cloud (Supabase).

### O que existe e funciona

- Autenticação básica (login/cadastro)
- **Repertório** — projetos, tipos de evento, lista de músicas, abas Repertório/Blocos
- **Tendências** — integração Spotify funcionando, categoria → subcategoria →
  playlist → seleção de músicas → adicionar ao repertório
- **Saúde Vocal** — 6 cards de aquecimento por situação, tela de exercícios
- **Diário de Treino** — Dia 1, círculo de progresso, lista de 7 exercícios (conteúdo
  é placeholder)
- **Evolução** — nível, XP, streak, gráfico semanal, 6 conquistas (dados zerados)
- Layout web com sidebar + versão mobile com bottom nav

### O que é fachada

Diário de Treino e Evolução têm a interface pronta mas **nenhuma lógica real por
trás**. Os 7 exercícios são texto fixo. XP não acumula. Nenhum exercício executa de
fato.

---

## 7. Integrações

### Spotify — funciona

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

Playlists oficiais confirmadas e estáveis:
- Top 50 Brasil — `37i9dQZEVXbMXbN3EUUhlg`
- Top Songs Brasil — `37i9dQZEVXbKzoK95AbRy9`

Endpoints usados: `/v1/search?type=playlist` e `/v1/playlists/{id}/tracks`

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

### IDs de playlist frágeis

O Lovable implementou "curadoria de IDs fixos" de playlists supostamente editoriais
(Esquenta Sertanejo, Louvor & Adoração etc.). **Só os IDs com prefixo `37i9dQZEVXb`
são oficiais do Spotify.** Os demais são de usuários comuns e podem ser deletados ou
renomeados a qualquer momento, quebrando o app em silêncio. Não confiar nesse trecho
sem verificar ID por ID.

### O bloqueio real: conteúdo

**Nada disso destrava sem a Laury.** O currículo de exercícios por tipo vocal
(soprano, mezzo, contralto, tenor, barítono, baixo) não existe. Sem ele, o Diário de
Treino é uma casca. Nenhum modelo de IA resolve isso — é conhecimento clínico que só
ela pode produzir e assinar.

**Pendente com ela:**
- Exercícios de aquecimento por estilo (agudo, grave, gravação, dicção, pós-show)
- Exercícios de treino por tipo vocal e por etapa do currículo
- Quantos dias tem o programa básico
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

Tipografia: **Cormorant Garamond** (títulos, números grandes, 300/600) +
**DM Sans** (interface, 300/400/500).

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
1. Currículo de exercícios com a Laury
2. Rotacionar a chave de API exposta
3. Escolher 3–5 referências visuais concretas

**Técnico:**
4. Migrar o código do Lovable para GitHub e rodar local
5. Integrar o teste de extensão vocal (já implementado isoladamente) no onboarding
6. Construir o motor único de treino com as notas-alvo vindas do currículo
7. Auditar os IDs de playlist do Spotify um por um

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
