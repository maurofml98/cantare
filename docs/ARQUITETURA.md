# Arquitetura

## Princípio central: motor único

A decisão mais importante do projeto. Veio da análise do Vocal Coach: todos os
exercícios dele reusam a mesma interface e mudam só o objetivo técnico.

**Um exercício novo é um objeto de configuração, não uma tela nova.**

Se você se pegar criando `ExercicioRespiracao.tsx` e `ExercicioAfinacao.tsx`, pare.
Está errado. É `MotorTreino.tsx` recebendo config diferente.

```
┌─────────────────────────────────────────┐
│  MotorTreino                            │
│                                         │
│  recebe: Exercicio + PerfilVocal        │
│                                         │
│  ┌───────────┐  ┌──────────┐            │
│  │ instrução │→ │ execução │→ resultado │
│  └───────────┘  └──────────┘            │
│                      │                  │
│         ┌────────────┼────────────┐     │
│         │            │            │     │
│    sustentacao    pitch      articulacao│
│    (RMS)      (autocorr)    (livre)     │
└─────────────────────────────────────────┘
```

---

## Schema de exercício

```ts
type Etapa =
  | 'aquecimento'
  | 'respiracao'
  | 'coordenacao'
  | 'flexibilidade'
  | 'afinacao'
  | 'ressonancia'
  | 'vozmista'
  | 'resistencia'
  | 'desaquecimento';

type TipoAnalise =
  | 'sustentacao'   // mede quanto tempo sustenta emissão contínua
  | 'pitch'         // compara nota produzida com nota-alvo
  | 'articulacao'   // só cronômetro, sem análise de áudio
  | 'livre';        // grava para histórico, sem avaliação

type Ressonancia = 'peito' | 'mista' | 'cabeca';

type Exercicio = {
  id: string;
  nome: string;
  etapa: Etapa;

  // texto que aparece antes de iniciar — vem da Laury, não inventar
  objetivo: string;      // "Soltar a musculatura do rosto"
  tecnica: string;       // "Mastigue exageradamente, boca fechada"

  duracaoSeg: number;
  series?: number;
  repeticoes?: number;

  tipoAnalise: TipoAnalise;
  ressonancia: Ressonancia;

  // só para tipoAnalise === 'pitch'
  // graus RELATIVOS à base da extensão do usuário, em semitons
  alvos?: { grau: number; duracaoSeg: number }[];

  obrigatorio: boolean;  // aquecimento e desaquecimento = true

  // qual tipo vocal pode receber este exercício
  // vazio = todos
  tiposVocais?: TipoVocal[];
};
```

---

## Notas-alvo relativas — o ponto crítico

Este é o detalhe que faz "personalizado por tipo vocal" funcionar de verdade em vez
de ser só marketing.

**Errado:** gravar as notas-alvo como absolutas (C4, E4, G4). Um exercício em C4 é
confortável para soprano e brutal para baixo.

**Certo:** gravar como grau relativo à base da extensão medida do usuário.

```ts
// exercício de arpejo simples
alvos: [
  { grau: 0,  duracaoSeg: 2 },  // base do usuário
  { grau: 4,  duracaoSeg: 2 },  // +4 semitons
  { grau: 7,  duracaoSeg: 2 },  // +7
  { grau: 12, duracaoSeg: 2 },  // oitava
  { grau: 7,  duracaoSeg: 2 },
  { grau: 4,  duracaoSeg: 2 },
  { grau: 0,  duracaoSeg: 2 },
]
```

Resolução:

```ts
function resolverAlvos(ex: Exercicio, perfil: PerfilVocal) {
  // base = alguns semitons acima da nota mais grave, para não exigir o extremo
  const base = perfil.midiMin + 3;
  return ex.alvos!.map(a => ({
    midi: base + a.grau,
    duracaoSeg: a.duracaoSeg,
  }));
}
```

**Regra de segurança:** nunca gerar alvo acima de `perfil.midiMax - 2`. O treino não
deve empurrar o cantor para o extremo da extensão. Se o exercício exigir, reduzir a
amplitude ou trocar de exercício. Isso é requisito clínico, não otimização.

---

## Perfil vocal

```ts
type TipoVocal =
  | 'baixo' | 'baritono' | 'tenor'
  | 'contralto' | 'mezzo' | 'soprano';

type PerfilVocal = {
  midiMin: number;        // nota mais grave medida
  midiMax: number;        // nota mais aguda medida
  tipoEstimado: TipoVocal;
  medidoEm: string;       // ISO date
  qualidadeMedicao: 'boa' | 'media' | 'ruim';  // vem do teste de ruído
};
```

Guardar **histórico**, não só o último. A extensão muda com treino, com o dia, com
aquecimento. E se a medição foi ruim, o app precisa saber disso para ponderar.

Faixas de classificação em MIDI:

| Tipo          | MIDI  | Notas   |
|---------------|-------|---------|
| Baixo         | 40–64 | E2–E4   |
| Barítono      | 45–69 | A2–A4   |
| Tenor         | 48–72 | C3–C5   |
| Contralto     | 53–77 | F3–F5   |
| Mezzo-soprano | 57–81 | A3–A5   |
| Soprano       | 60–84 | C4–C6   |

Classificação: sobreposição sobre união, penalizada pela distância entre centros.
Tratar sempre como **estimativa**.

---

## Detecção de pitch

Autocorrelação, 100% no navegador. Sem servidor, sem API, sem custo. Mesma técnica
de afinador online.

Implementação de referência já escrita em `teste-vocal-cantare.jsx`.

```
getUserMedia → AudioContext → AnalyserNode(fftSize: 2048)
  → getFloatTimeDomainData
  → autocorrelação na faixa 65–1100 Hz
  → correção de erro de oitava
  → interpolação parabólica
  → frequência → MIDI
```

### Parâmetros calibrados

```ts
const GATE_RMS = 0.009;        // abaixo = silêncio
const FREQ_MIN = 65;           // ~C2
const FREQ_MAX = 1100;         // ~C#6
const GATE_CLAREZA = 0.55;     // correlação / energia
const OCTAVE_PREF = 0.86;      // prefere pico anterior com ≥86% da correlação
```

### getUserMedia — obrigatório

```ts
navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
  }
})
```

Os filtros do navegador destroem a análise de pitch. Isto não é opcional.

### Estabilização

Uma leitura isolada não vale nada — vibrato, transiente e ruído geram lixo. Só
registrar nota quando houver 8+ leituras em ~420ms dentro de ±0,7 semitom.

```
histórico → mediana → % de leituras dentro de ±0.7 da mediana
  → se > 0.75, considera estável
```

### Conversão

```ts
const midi = (freq: number) => 69 + 12 * Math.log2(freq / 440);
const freq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);
```

### Limitações conhecidas

Documentar na interface, não esconder:

- Voz grave + microfone ruim → erro de oitava
- Vibrato forte → dificulta estabilização
- Ruído ambiente → resultado não confiável
- Microfone de celular com AGC → leitura inconsistente

---

## Validação de ambiente

Obrigatória antes da primeira sessão do dia e antes do teste de extensão.
Veio da referência do Vocal Coach e resolve o problema real que a Laury teve.

```
1. permissão de microfone
2. escuta 3s em silêncio → mede RMS médio
     < 0.014  → "ambiente silencioso", segue
     < 0.028  → "há algum ruído", avisa e deixa seguir
     ≥ 0.028  → "muito ruído", recomenda trocar de lugar
3. aviso de fone de ouvido (não bloqueia)
```

Gravar o resultado em `PerfilVocal.qualidadeMedicao`.

---

## Análise de sustentação

Para o exercício "SSS" de 30 segundos. Não é cronômetro — mede se a emissão continua.

```
enquanto RMS > gate por N frames consecutivos → sustentando
se RMS < gate por > 250ms → quebrou
resultado: "sustentou 22 de 30 segundos"
```

Sem punição. Botão "tentar novamente" imediato. A referência fazia isso e funciona.

---

## Estrutura de pastas sugerida

```
src/
  motor/
    MotorTreino.tsx           # a interface única
    analise/
      pitch.ts                # autocorrelação, conversões
      sustentacao.ts          # detecção de quebra
      ambiente.ts             # medição de ruído
    alvos.ts                  # resolver graus relativos → MIDI
  perfil/
    TesteExtensao.tsx         # onboarding vocal
    classificar.ts            # MIDI → tipo vocal
  curriculo/
    exercicios.ts             # dados vindos da Laury
    trilhas.ts                # sequência por tipo vocal
    dia.ts                    # que exercício aparece hoje
  repertorio/
  saude/
  integracoes/
    spotify.ts
  design/
    tokens.ts
```

---

## Spotify — limitações reais da API

Client Credentials Flow, chamado só no servidor (`src/lib/api/spotify.ts`, via
`createServerFn`). Testado com as credenciais do app em 14/09/2026:

| Chamada | Resultado |
|---|---|
| `GET /v1/playlists/{id}` (editorial `37i9dQZF1…` / `37i9dQZEVXb…`) | 404, mesmo com ID válido |
| `GET /v1/playlists/{id}/tracks` (qualquer playlist, inclusive de usuário) | 403 |
| `GET /v1/search?type=playlist` | 200, mas com itens `null` e sem acesso às faixas |
| `GET /v1/search?type=track&market=BR&limit=10` | 200, dados completos |
| `GET /v1/search?type=track&limit=20` | 400 "Invalid limit" |

Consequências para o produto:

- Desde novembro de 2024 apps novos não acessam playlists editoriais nem algorítmicas.
  Não existe "em alta" ou "viral" disponível — não prometer isso na interface.
- Não guardar IDs de playlist no código. Categorias são **buscas de faixa
  pré-definidas** (categoria → subcategoria → query).
- Máximo de 10 resultados por busca.
- A API não informa o tom da música: a faixa entra no repertório sem tom, e o cantor
  preenche.

---

## Privacidade

O áudio é processado no aparelho e não sai dele. Isso não é só boa prática — dado de
voz é biométrico e cai na LGPD. Declarar explicitamente na interface.

Se em algum momento for necessário enviar áudio para servidor (por exemplo, análise
mais pesada que não roda no cliente), isso passa a exigir consentimento específico,
criptografia em trânsito e em repouso, e opção de deletar. Evitar enquanto possível.
