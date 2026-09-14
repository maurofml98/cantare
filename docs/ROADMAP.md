# Roadmap

Cada fase só começa quando a anterior estiver de pé. O erro clássico deste tipo de
projeto — apontado no documento estratégico original — é tentar construir os dez
módulos de uma vez.

O documento original propunha 7 fases em 36 meses. Este roadmap é mais enxuto e
reordenado, porque a descoberta do Vocal Coach mudou a prioridade: o onboarding vocal
deixou de ser Fase 2 e passou a ser o coração do produto.

---

## Fase 0 — Fundação

Tirar o projeto do Lovable e deixar o terreno limpo. Nada de feature nova aqui.

- [ ] Conectar Lovable ao GitHub e clonar local
- [ ] `npm install` e rodar
- [ ] **Rotacionar a chave do YouTube** que foi exposta em chat
- [ ] Confirmar `.env*` no `.gitignore`
- [ ] Auditar os IDs de playlist do Spotify um por um (ver BACKLOG)
- [ ] Remover código morto da integração YouTube
- [ ] Escolher 3–5 referências visuais concretas antes de mexer em design

**Critério de saída:** roda local, sem segredo no repositório, sem dependência frágil
silenciosa.

---

## Fase 1 — Onboarding vocal

O diferencial. O que a Laury mais se empolgou e o que nenhum app de repertório tem.

- [ ] Integrar o teste de extensão (já implementado isolado) no fluxo de cadastro
- [ ] Validação de ambiente obrigatória antes do teste
- [ ] Persistir perfil vocal: nota mais grave, mais aguda, tipo estimado, data
- [ ] Permitir refazer o teste a qualquer momento — nunca tratar como definitivo
- [ ] Guardar histórico dos testes (a extensão muda com treino e com o dia)

**Critério de saída:** um cantor faz o cadastro, canta, e o sistema sabe a faixa dele.

**Risco:** ruído ambiente pode dar resultado errado. A própria Laury teve soprano num
dia e contralto no outro. O produto precisa assumir isso na comunicação, não esconder.

---

## Fase 2 — Motor de treino

Uma interface, N exercícios. Ver `ARQUITETURA.md`.

- [ ] Engine que recebe config de exercício e renderiza
- [ ] Tipo `sustentacao` — detecta quebra de expiração (exercício "SSS" de 30s)
- [ ] Tipo `pitch` — trilha de notas-alvo + marcador da voz ao vivo
- [ ] Notas-alvo **relativas** ao perfil vocal, nunca absolutas
- [ ] Orientação corporal (peito / mista / cabeça) como apoio visual
- [ ] Tela de resultado: precisão, estrelas, tempo
- [ ] Progressão automática para o próximo exercício — nunca tela vazia
- [ ] Aquecimento travado como primeiro item da sessão

**Critério de saída:** dá para executar uma sessão inteira de ponta a ponta com
exercícios de mentira, e o fluxo faz sentido.

---

## Fase 3 — Currículo real

Trocar o placeholder pelo conteúdo clínico.

- [ ] Receber `CURRICULO-LAURY.md` preenchido
- [ ] Modelar as trilhas por tipo vocal
- [ ] Lógica de dia N: qual exercício aparece hoje
- [ ] Aquecimentos por estilo (agudo, grave, gravação, dicção, pós-show)
- [ ] Revisão da Laury na linguagem de todas as telas de saúde vocal

**Bloqueado por:** a Laury. Sem isso o Diário de Treino é uma casca.

**Critério de saída:** um cantor treina 7 dias seguidos com conteúdo que a Laury
assina embaixo.

---

## Fase 4 — Repertório para o palco

O Repertório já existe, mas não serve para o que o cantor faz na sexta-feira à noite.

- [ ] Campo de tom por música — hoje não existe, é a dor mais clara
- [ ] **Modo Performance** — tela de palco: letra grande, tom visível, fundo preto,
      tela não apaga, brilho alto. Nenhum app brasileiro faz isso bem
- [ ] Duração estimada do show (~3,5 a 4 min por música) com aviso de faltante
- [ ] Bloco de músicas de reserva, para pedido do público
- [ ] Marcador "preciso ensaiar" por música
- [ ] Exportar repertório em PDF para mandar para a banda
- [ ] Duplicar projeto

**Critério de saída:** um cantor de barzinho consegue montar e usar um show real.

---

## Fase 5 — Ear training

Módulo separado de percepção musical, em formato de minigame.

- [ ] Iguais ou diferentes
- [ ] Reproduza a sequência cantando
- [ ] Qual nota mudou
- [ ] Identifique a tecla
- [ ] Ascendente ou descendente
- [ ] Dificuldade progressiva (2 notas → 3 → intervalos maiores → escalas → trechos)
- [ ] **Diferencial:** gerar desafios a partir das músicas do repertório do próprio
      cantor, via Spotify. Treinar o intervalo de uma música que ele vai cantar,
      não escala abstrata. Nenhum concorrente faz isso

**Critério de saída:** o cantor treina ouvido com a música dele.

---

## Fase 6 — Retenção

Só faz sentido quando existe conteúdo real para retornar.

- [ ] XP e níveis com regra de verdade
- [ ] Streak de dias
- [ ] Conquistas
- [ ] Relatório semanal com interpretação, não só número:
      "sua estabilidade caiu acima de F#4", "sua extensão aumentou 2 semitons"
- [ ] Comparação com o próprio histórico — evitar comparar com outros usuários, ou
      pelo menos deixar desativável

---

## Fase 7 — Painel do fonoaudiólogo

O que transforma a Laury de garota-propaganda em usuária.

- [ ] Vincular paciente ao profissional
- [ ] Ver histórico de gravações e evolução
- [ ] Alertas de sinais de esforço
- [ ] Mensagem pela plataforma
- [ ] Relatório exportável para embasar consulta

Abre a monetização B2B: fono, professor de canto, escola, igreja.

---

## Fora do escopo

Coisas que apareceram na conversa e foram descartadas ou adiadas indefinidamente:

- **Separação vocal / remover voz da música** — direito autoral e custo computacional.
  Moises e Lalal já fazem
- **Transposição de áudio** — mesma questão
- **Cifras completas** — 400 mil cifras é o Cifra Club. Não competir aí
- **Backing track gerado por IA** — qualidade ainda insuficiente
- **Clonagem vocal** — proibido por decisão ética, ver `CLAUDE.md` seção 10
- **Marketplace de profissionais** — só depois da Fase 7
