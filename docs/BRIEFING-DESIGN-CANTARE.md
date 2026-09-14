# Briefing de design — Cantare

Documento para quem vai assumir a direção visual do produto.
Leia inteiro antes de propor qualquer coisa. A seção 7 explica por que cinco
tentativas anteriores foram rejeitadas — não repita os mesmos caminhos.

---

## 1. O que é o Cantare

Um aplicativo para cantores brasileiros. Três coisas em um lugar:

**Treino vocal com análise de áudio.** O app ouve a pessoa cantar pelo microfone,
detecta em tempo real qual nota ela está produzindo, e compara com a nota que ela
deveria estar cantando. No primeiro acesso, mede a extensão vocal dela — da nota mais
grave até a mais aguda — e estima o tipo de voz (contralto, tenor, soprano e outros).
Todos os exercícios seguintes são montados dentro dessa faixa.

**Saúde vocal.** Exercícios de aquecimento e desaquecimento, organizados por
situação: dificuldade nos agudos, nos graves, dia de gravação, melhorar dicção,
pós-show. O conteúdo é de uma fonoaudióloga.

**Repertório para show.** O cantor cria projetos — "Bar do Zé, sexta" ou "Casamento
da Ana" — e dentro de cada um monta a lista de músicas, organizada em blocos, com o
tom de cada uma. Busca músicas em alta por gênero via Spotify.

Não é streaming. Não toca música. Não é rede social. É ferramenta de trabalho.

---

## 2. Quem usa

O usuário principal é o **cantor de barzinho**. Não é o artista de arena. É quem canta
três horas por noite num bar, num casamento, numa festa de empresa, ou toca na banda
da igreja.

Palavras da fonoaudióloga do projeto, sobre esse público:

> "Tem gente vendendo carro para gravar um DVD. Tem gente se enfiando em dívida,
> pegando empréstimo para gravar alguma coisinha. Tem gente trabalhando à noite para
> comer no outro dia de manhã. A maioria é isso. É a realidade do cantor hoje."

Implicações diretas para o design:

- **Android simples.** Ela foi explícita: "esse aplicativo tem que rodar lá". Não
  assumir tela grande, GPU boa ou internet rápida
- **Pouco poder aquisitivo.** O produto precisa parecer valer o dinheiro, mas sem
  soar inacessível ou elitista
- **Não é público técnico.** Ninguém aqui sabe o que é "tessitura" ou "belting".
  Termo técnico precisa de tradução
- **Usa no palco.** Uma das telas vai ser usada com microfone na mão, no escuro,
  no meio de um show. Fonte grande, toque grande, zero firula

Perfis secundários: cantor profissional, artista independente, produtor musical,
professor de canto, grupo de louvor de igreja, e a própria fonoaudióloga
acompanhando pacientes.

---

## 3. Quem é a Laury

Fonoaudióloga especializada em voz artística. Atende cantores profissionais. A ideia
do produto é dela, e ela é a autoridade técnica e a face pública.

Isso importa para o design porque **a credibilidade clínica é o diferencial do
produto**. Não existe outro app brasileiro de canto com uma fonoaudióloga por trás.
O visual precisa transmitir cuidado profissional, não gamificação infantil — mas
sem virar interface de hospital.

Ela é também a guardiã ética. Existem coisas que o produto nunca pode fazer (seção 5).

---

## 4. As telas

O que existe hoje, construído:

**Onboarding / Teste de extensão vocal**
Pede o microfone, mede o ruído do ambiente por três segundos, pede para a pessoa
descer até a nota mais grave, depois subir até a mais aguda. Mostra o resultado:
faixa vocal e tipo estimado.

**Home**
Saudação, resumo do dia — quantos exercícios, estado do repertório —, músicas em
alta do Spotify, dica da fonoaudióloga.

**Diário de Treino**
A sessão do dia. Sequência fixa de exercícios: aquecimento, respiração, coordenação,
flexibilidade, afinação, voz mista, desaquecimento. Círculo de progresso, lista dos
exercícios, streak de dias.

**Tela de exercício**
A mais importante e a mais complexa. Precisa mostrar simultaneamente:
- Instrução do exercício antes de começar
- Cronômetro
- As notas que a pessoa deve cantar
- A nota que ela está cantando de fato, ao vivo, comparada com a esperada
- Uma indicação de onde a ressonância deve acontecer no corpo (peito, mista, cabeça)
- Controles: iniciar, pausar, reiniciar, pular

**Resultado do exercício**
Precisão, estrelas, tempo, XP, e uma frase interpretando o desempenho.

**Saúde Vocal**
Lista de aquecimentos por situação. Cada um abre uma sequência de até quatro
exercícios explicados visualmente.

**Repertório**
Lista de projetos. Dentro de um projeto: músicas com tom, organizadas em blocos de
show. Busca de tendências por gênero.

**Modo Performance** (planejado, não construído)
Tela de palco. Letra grande, tom visível, fundo escuro, tela que não apaga.

**Evolução**
Nível, XP, streak, gráfico de precisão semanal, conquistas.

---

## 5. Restrições que não se negociam

Vêm da responsabilidade profissional da fonoaudióloga.

1. **Nunca a palavra "diagnóstico", "laudo" ou "avaliação clínica".** Sempre "análise
   de performance", "acompanhamento", "sinais de atenção"
2. **Aquecimento antes de qualquer treino.** Não pode ser pulável. Risco de lesão
   vocal é real
3. **Todo resultado carrega orientação** de procurar profissional em caso de dor,
   rouquidão ou desconforto
4. **Nenhuma promessa de cura ou tratamento**
5. **O resultado do teste vocal nunca é apresentado como definitivo.** A própria
   Laury fez o teste em dois dias e deu resultado diferente, por causa de ruído
   ambiente. A interface precisa comunicar estimativa, não veredito

Isso tem consequência visual: o app não pode parecer equipamento médico nem app de
diagnóstico. Também não pode parecer jogo, porque banalizaria o cuidado com a voz.

---

## 6. Referência de mercado

O produto que a Laury usou e adorou é o **Vocal Coach**. Dele vem a mecânica:
teste de extensão no onboarding, trilha de notas com feedback ao vivo, wireframe de
corpo humano indicando ressonância, validação de ruído antes de começar, currículo
progressivo em dias, gamificação com estrelas e percentil.

O que ele **não** tem e o Cantare vai ter: saúde vocal com respaldo clínico,
repertório de show, foco no cantor brasileiro.

O outro lado da referência é o **Cifra Club** — 400 mil cifras, transposição de tom,
rolagem automática. Mas é feito para instrumentistas, não para cantores.

A frase que resume a ambição: **Vocal Coach + Cifra Club, melhorado e brasileiro.**

---

## 7. O que já foi tentado e rejeitado

Esta é a seção mais importante do documento.

Foram **cinco rodadas completas de design**, todas recusadas. Sempre com a mesma
frase: "está com cara de IA".

| Rodada | O que foi feito | Por que caiu |
|---|---|---|
| 1 | Fundo preto, dourado, ícones de biblioteca (Tabler), cards arredondados iguais | Genérico. O ícone dentro de círculo colorido foi apontado como o marcador número um de "app gerado" |
| 2 | Cormorant Garamond nos títulos, DM Sans no corpo, ícones removidos, linhas douradas finas | Melhorou, ainda insuficiente |
| 3 | Ilustrações SVG conceituais, algarismos romanos no menu, lista editorial estilo revista | Ficou vazio e frio. Perdeu o calor humano |
| 4 | Glassmorphism, orbs de luz com blur, partículas flutuantes, cinco tipos de animação | Não chegou a ser avaliado |

**Diagnóstico honesto:** o problema nunca foi execução. Foi ausência de alvo.
As instruções eram adjetivos — "premium", "luxuoso", "humanizado", "sem cara de IA".
Adjetivo não converge. Cinco execuções tecnicamente competentes e subjetivamente
erradas, porque não havia referência concreta para comparar.

**Por isso este briefing existe.** O que se espera do designer não é mais uma
proposta em palavras. É direção visual concreta.

### Proibições acumuladas

Cada item foi recusado explicitamente em alguma rodada:

- Roxo, lilás, neon — descartados
- Ícone dentro de círculo colorido
- Pill colorida marcando o item ativo do menu
- Ícones de biblioteca (Lucide, Tabler, Heroicons) em cards de conteúdo. Aceitável
  só em ações: fechar, voltar
- Emoji em qualquer lugar da interface
- Gradiente colorido óbvio
- Label em caixa alta acima de todo título
- Seta `→` grudada no texto de todo botão
- Numeração 01 / 02 / 03 onde o conteúdo não é sequência
- Cards idênticos com a mesma sombra cinza suave debaixo de cada um

### Referências levantadas, nunca escolhidas

- **App de sono Somnia** — foi o que mais agradou. Círculo grande central com número
  dentro, saudação humana, indicadores da semana em bolinhas, card de dica
  contextual, profundidade escura com elementos sutis
- **Concept de Apple Music desktop** — a estrutura de três colunas agradou; as cores
  roxo e neon foram rejeitadas
- **Mume, player de música** — capas grandes, menu de contexto ao segurar
- **Mtouch** — dark premium, tipografia forte

---

## 8. O que funcionou

Um único elemento atravessou todas as rodadas sem ser rejeitado: a **escada vertical
de notas** da tela de teste vocal.

É uma coluna de traços horizontais, um para cada semitom, do grave embaixo ao agudo
em cima. Enquanto a pessoa canta, um risco de luz sobe e desce nessa escada mostrando
a nota atual. A faixa que ela já conquistou fica pintada.

Por que funcionou: não é um card de dashboard. É a forma que **já existe no mundo do
cantor** — uma extensão vocal literalmente é um segmento numa linha vertical.

Essa é a pista para o resto do produto: procurar a forma que já existe no universo
musical, em vez de aplicar layout genérico de SaaS em cima de conteúdo musical.

---

## 9. Tokens atuais

Última paleta definida. Ponto de partida, não obrigação — pode ser questionada, desde
que a proposta venha acompanhada de justificativa e referência.

```
Fundo base        #07080A   preto com leve tom azul-petróleo
Fundo secundário  #0D0F12
Card              rgba(255,255,255,0.03)
Borda             rgba(255,255,255,0.06)
Dourado           #B8955A   envelhecido, não amarelo
Texto             #E8E4DC   marfim, não branco puro
Texto secundário  rgba(232,228,220,0.4)
Atenção           #C87F6A
```

Tipografia: **Cormorant Garamond** (300, 600) nos títulos e números grandes,
**DM Sans** (300, 400, 500) na interface.

Stack: React 19, TanStack Start, Tailwind 4, Radix UI. Entregáveis em CSS/Tailwind
são aproveitáveis direto.

---

## 10. O que se espera como entrega

Nesta ordem de prioridade:

**1. Direção visual com referência concreta.**
Três a cinco imagens de produtos reais que definam o alvo. Não descrição — imagem.
Se possível, indicar exatamente o que em cada uma deve ser aproveitado: "a hierarquia
tipográfica desta", "a profundidade de fundo daquela".

**2. Um sistema, não uma tela.**
Tokens de cor com função definida, escala tipográfica, espaçamento, tratamento de
card, estados (vazio, carregando, erro), e como o item ativo se diferencia.

**3. Três telas resolvidas, em ordem:**
- **Tela de exercício** — a mais difícil. Precisa comportar trilha de notas, nota ao
  vivo, cronômetro, corpo humano e controles sem virar cockpit de avião
- **Diário de Treino** — a tela de retorno diário
- **Home** — a primeira impressão

**4. Mobile primeiro.** Desktop é consequência, não o contrário.

**5. Uma decisão de ousadia, e só uma.** Um elemento memorável, tudo em volta quieto
e disciplinado.

---

## 11. Perguntas que ajudam a acertar

Se algo aqui não estiver claro, melhor perguntar antes de executar:

- Qual é a sensação certa? Estúdio de gravação, consultório, palco, caderno de
  música, outra coisa?
- O escuro é obrigatório ou foi só herança das tentativas anteriores?
- O dourado é a cor certa ou existe caminho melhor para "cuidado profissional"?
- Como representar voz e som sem cair no clichê da onda de equalizador?
- Como o corpo humano aparece na tela de exercício sem parecer ilustração médica?

---

## 12. Resumo em uma frase

Um cantor de barzinho, com celular simples, abre o app antes do show para aquecer a
voz, confere o repertório da noite, e no dia seguinte treina dez minutos para não
perder a voz aos quarenta anos. O app precisa parecer feito por alguém que entende
de música e de voz — não por um gerador de telas.
