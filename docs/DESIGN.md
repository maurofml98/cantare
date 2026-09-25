# Design

## Leia isto antes de abrir qualquer arquivo de estilo

O design deste projeto passou por **mais de cinco rodadas completas de redesign** e
nenhuma foi aprovada. Todas foram rejeitadas com alguma variação de "está com cara de
IA".

O problema nunca foi execução. Foi ausência de alvo.

Descrever estilo em palavras — "premium", "luxuoso", "humanizado", "sem cara de IA" —
não converge. Cada rodada produziu algo tecnicamente competente e subjetivamente
errado, porque não havia referência concreta para comparar.

**Regra:** não iniciar rodada de design sem 3 a 5 imagens de referência escolhidas.
Sem isso, é desperdício de tempo.

---

## Direção escolhida — colorida (25/09/2026)

A Laury viu as duas propostas e **prefere a colorida**. É a primeira escolha concreta
de direção desde o início do projeto.

**Falta registrar:** as duas propostas não estão no repositório. Salvar as imagens em
`docs/referencias/` (a colorida e a descartada), com data, antes da próxima rodada —
senão a escolha volta a ser descrição em palavras.

**Conflitos a resolver antes de codar:**
- Os tokens abaixo (dark + dourado envelhecido) e a identidade da seção 9 do
  `CLAUDE.md` deixam de ser a direção. Não trocar tokens sem a referência salva
- "Gradientes coloridos óbvios" e "roxo, lilás, neon" estão nas proibições. Se a
  proposta colorida usa algum deles, a Laury precisa saber que está revertendo uma
  rejeição anterior — ou a proibição cai, ou a paleta muda
- Combina com o reposicionamento (ecossistema de música, não treino clínico) e com o
  pedido dela de identidade "mais divertida" (`CLAUDE.md`, seção 13, contradição 2)

---

## O que já foi tentado e rejeitado

| Tentativa | O que era | Por que caiu |
|---|---|---|
| 1 | Dark + dourado, ícones Tabler, cards arredondados | Genérico. Ícone dentro de círculo colorido foi apontado como o marcador principal de "app de IA" |
| 2 | Cormorant Garamond + DM Sans, remoção de ícones, linhas douradas finas | Melhor, ainda insuficiente |
| 3 | Ilustrações SVG conceituais, algarismos romanos no menu, lista editorial | Ficou vazio e frio. Perdeu calor humano |
| 4 | Glassmorphism, orbs de luz, partículas flutuantes, 5 animações | Nunca foi avaliado — o processo parou antes |

## Referências levantadas mas nunca escolhidas

- Concept de Apple Music desktop — **estrutura** de 3 colunas aprovada, cores roxo/neon rejeitadas
- App de sono Somnia — círculo central grande com número dentro, saudação humana, indicadores semanais, card de dica contextual. **Foi a que mais agradou**
- Mume (player de música) — capas grandes, cores vivas, menu de contexto
- Mtouch — dark premium, tipografia forte

Buscas de Pinterest sugeridas: `dark music app UI design`,
`vocal training app UI concept`, `human body wireframe UI app design`,
`editorial dark UI typography luxury app`.

**Próximo passo de design:** escolher 3–5 pins e colocar em `docs/referencias/`.

---

## Tokens atuais

Última paleta definida. Não validada visualmente pelo Mauro.

```css
--ink:           #07080A;              /* fundo base, preto com tom azul-petróleo */
--ink-2:         #0D0F12;              /* fundo secundário */
--card:          rgba(255,255,255,0.03);
--card-border:   rgba(255,255,255,0.06);
--gold:          #B8955A;              /* dourado envelhecido, não amarelo */
--gold-dim:      rgba(184,149,90,0.28);
--paper:         #E8E4DC;              /* marfim, não branco puro */
--paper-2:       rgba(232,228,220,0.4);
--paper-3:       rgba(232,228,220,0.18);
--warn:          #C87F6A;              /* erro / atenção */
```

## Tipografia

```
Títulos, números grandes  →  Newsreader  (300, 600, com itálico)
Interface, labels, texto  →  DM Sans     (300, 400, 500)
```

Duas famílias, bem distintas. Serifada no peso 300 para títulos grandes — a
elegância vem do peso leve, não do bold.

**Por que não Cormorant Garamond (troca feita em 14/09/2026):** a versão servida pelo
Google Fonts desenha o circunflexo deslocado ("quê", "Sequência", "Você") em toda a
família Cormorant. Inaceitável num app em português. Newsreader tem o mesmo peso leve
editorial e diacríticos corretos. Antes de trocar a serifada de novo, testar
`ê â ô ã õ ç` renderizados.

---

## Proibições acumuladas

Cada item foi rejeitado explicitamente em alguma rodada. Não reintroduzir.

- **Roxo, lilás, neon** — descartados definitivamente
- **Ícone dentro de círculo colorido** — marcador número um de "app genérico"
- **Pill/cápsula colorida no item ativo do menu** — usar linha vertical
- **Ícones de biblioteca em cards de conteúdo** (Lucide, Tabler, Heroicons). Aceitável
  apenas em ações funcionais: fechar, voltar
- **Emojis** em qualquer lugar da interface
- **Gradientes coloridos óbvios**
- **Labels em caixa alta acima de todo heading** — tique de página gerada
- **`→` grudado no texto de todo botão** — usado em excesso nas rodadas anteriores
- **Numeração 01 / 02 / 03** quando o conteúdo não é sequência. No Diário de Treino é
  sequência e pode; em lista de cards aleatórios, não

---

## Diretrizes

**Mobile importa mais que desktop.** O público-alvo é o cantor de barzinho, que usa
Android simples. A Laury foi explícita: "esse aplicativo tem que rodar lá".

**Menos texto.** Ela também foi explícita: "texto vai quebrar o negócio". Exercício
deve ser explicado por desenho ou loop animado, não por parágrafo.

**Estado vazio é convite, não erro.** "Sem projetos" não ajuda ninguém. "Crie seu
primeiro repertório" com um botão ajuda.

**Motion responde a ação.** Animação que reage ao usuário — a nota que sobe quando ele
canta, o círculo que preenche quando ele conclui — é boa e desejada. Animação ambiente
espalhada por todos os cards é o default gerado e foi rejeitada.

**Gaste ousadia em um lugar.** Na tela de treino, o elemento memorável é a escada de
notas com a voz do cantor riscando ela. Tudo em volta fica quieto.

---

## O que funcionou

Um único componente atravessou as rodadas sem rejeição: a **escada vertical de notas**
do teste de extensão (`Ladder` em `teste-vocal-cantare.jsx`).

Por quê: não é um card de dashboard. É a representação que um cantor já entende —
a extensão vocal literalmente *é* um segmento numa linha vertical. A voz aparece como
um risco de luz que sobe e desce, e a faixa conquistada fica pintada.

Vale usar como ponto de partida da linguagem visual do resto do app: buscar a forma
que já existe no mundo do cantor, em vez de aplicar um layout genérico de SaaS.
