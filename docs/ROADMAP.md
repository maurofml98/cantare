# Roadmap

Cada fase só começa quando a anterior estiver de pé. O erro clássico deste tipo de
projeto — apontado no documento estratégico original — é tentar construir os dez
módulos de uma vez.

O documento original propunha 7 fases em 36 meses. Este roadmap é mais enxuto.

**Reordenado em 23/09/2026** após a especificação da aba Treinos entregue pela Laury
(`docs/laury/`, resumida na seção 13 do `CLAUDE.md`). O que mudou:

- O conteúdo clínico, que era o bloqueio de tudo, chegou para **Treinos**. O motor
  de treino sai da espera e vira a prioridade
- O Diário de Treino como sequência fixa do dia foi substituído pelo modelo de
  academia: o cantor escolhe um de 5 objetivos
- Meta, recorde e evolução deixaram de ser "retenção para depois": são os passos
  7 e 8 de todo exercício, obrigatórios pela especificação
- Os exercícios foram divididos pelo que o app já sabe medir. Os que não dependem
  de pitch nem de perfil vocal vão primeiro

---

## Fase 0 — Fundação

Nada de feature nova aqui.

- [x] Conectar Lovable ao GitHub e clonar local
- [x] `npm install` e rodar
- [ ] **Rotacionar a chave do YouTube** que foi exposta em chat
- [x] Confirmar `.env*` no `.gitignore`
- [x] Auditar os IDs de playlist do Spotify — os 20 deram 404, removidos
- [x] Remover código morto da integração YouTube
- [ ] Escolher 3–5 referências visuais concretas antes de mexer em design

**Critério de saída:** sem segredo exposto, sem dependência frágil silenciosa.

---

## Fase 1 — Motor de treino e detecção

Uma interface, N exercícios. Os 8 passos da especificação (o que fazer → como
fazer → modelo → executar → feedback → resultado → meta → evolução) são os estados
do componente. Ver `ARQUITETURA.md`.

- [ ] Motor nos 8 passos, recebendo config de exercício
- [ ] **Corrigir o bug do microfone na duração de emissão contínua** — bloqueia
      metade dos exercícios. Detectar por energia, não por pitch ("S" e "X" são
      surdos)
- [ ] Contagem de pulsos por ataque no envelope (novo analisador)
- [ ] Curva de intensidade relativa (novo analisador)
- [ ] Cronômetro de leitura
- [ ] Validação de ambiente antes do primeiro exercício da sessão
- [ ] Aquecimento travado antes de qualquer treino — **mantido** até a Laury dizer
      onde ele entra no modelo de academia (contradição 1, seção 13)
- [ ] Meta progressiva e recorde pessoal por exercício, persistidos

**Critério de saída:** um exercício de cada tipo de análise roda nos 8 passos com
voz real, em Android simples.

---

## Fase 2 — Treinos, lote A: sem pitch

Os exercícios que o app consegue medir sem saber a faixa vocal do cantor.

- [ ] Aba Treinos com os 5 cards de objetivo (os outros 3 aparecem como "em breve")
- [ ] **Respiração** — S sustentado (meta 8/10/12/15s), S pulsado, controle com "X"
- [ ] **Articulação e Dicção** — 6 trava-línguas cronometrados, recorde de tempo
- [ ] Ilustração da inspiração, lembretes visuais ("relaxe os ombros", "abra mais
      a boca") — instrução, nunca feedback

**Pendente com a Laury:** meta de pulsos do S pulsado, progressão do "X", tempo-meta
de cada trava-língua.

**Critério de saída:** um cantor faz Respiração e Articulação de ponta a ponta e vê
o recorde subir.

---

## Fase 3 — Perfil vocal

Pré-requisito do lote B: escala sem faixa vocal pode forçar a voz.

- [x] Portar o teste de extensão
- [ ] Integrar no fluxo de cadastro, com validação de ambiente
- [ ] Persistir perfil com histórico — a extensão muda com treino e com o dia
- [ ] Refazer a qualquer momento — nunca tratar como definitivo

**Risco:** ruído ambiente pode dar resultado errado. A própria Laury teve soprano num
dia e contralto no outro. O produto precisa assumir isso na comunicação.

---

## Fase 4 — Treinos, lote B: com pitch

- [ ] **Flexibilidade** — escalas em vibração de lábios, vogais A-E-I-O-U e "Z",
      com pista visual (trilha), pista auditiva (modelo) e acerto/erro
- [ ] **Firmeza Vocal** — Espaguete + VU, Finger kazoo, Som de sapo
- [ ] **Ressonância** — mastigação + HUMMM, messa di voce, humming
- [ ] Notas-alvo relativas ao perfil vocal, nunca absolutas
- [ ] Animações demonstrativas (bochechas, cara de nojo, mastigação)

**Bloqueado por respostas da Laury:** desenho das escalas, se muda por tipo vocal,
messa di voce (intensidade ou altura?), metas numéricas, tom das ilustrações
"divertidas" (contradição 2).

**Critério de saída:** os 15 exercícios rodam, com conteúdo que a Laury assina.

---

## Fase 5 — Evolução e retenção

Recorde e meta já vêm da Fase 1. Aqui entra o que é agregado.

- [ ] Tela Evolução com dados reais (hoje zerada)
- [ ] XP e níveis com regra de verdade — só no treino, nunca no aquecimento
- [ ] Streak, desafios diários, conquistas
- [ ] Relatório semanal interpretativo, terminando com "procure um profissional"
- [ ] Só comparação com o próprio histórico — a Laury pediu evolução individual,
      não competição entre usuários

---

## Fase 6 — Repertório para o palco

Praticamente concluída. Restante:

- [x] Campo de tom, Modo Performance, duração estimada, reservas, PDF, duplicar
- [ ] Marcador "preciso ensaiar" por música

---

## Fase 7 — Jogos: ritmo e ear training

- [ ] **Palavra + ritmo** (proposta da Laury) — batida → imagem → palavra no tempo,
      velocidade crescente. Reusa o analisador de pulsos com tempo do ataque
- [ ] Ear training: iguais ou diferentes, reproduza cantando, qual nota mudou,
      identifique a tecla, ascendente ou descendente
- [ ] **Diferencial:** desafios a partir das músicas do repertório do cantor

---

## Fase 8 — Painel do fonoaudiólogo

O que transforma a Laury de garota-propaganda em usuária.

- [ ] Vincular paciente ao profissional
- [ ] Ver histórico e evolução
- [ ] Alertas de sinais de esforço
- [ ] Relatório exportável para embasar consulta

Abre a monetização B2B: fono, professor de canto, escola, igreja.

---

## Fora do escopo

- **Reconhecimento de fala para avaliar articulação** — português offline em
  Android simples não é confiável. O trava-língua mede tempo, não clareza
- **Detectar expressão facial, bochechas, postura** — instrução visual, não feedback
- **Separação vocal / remover voz da música** — direito autoral e custo. Moises e
  Lalal já fazem
- **Transposição de áudio** — mesma questão
- **Cifras completas** — 400 mil cifras é o Cifra Club. Não competir aí
- **Backing track gerado por IA** — qualidade ainda insuficiente
- **Clonagem vocal** — proibido por decisão ética, ver `CLAUDE.md` seção 10
- **Marketplace de profissionais** — só depois da Fase 8
