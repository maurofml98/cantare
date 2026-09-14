import React, { useState, useRef, useEffect, useCallback } from "react";
import { NoteLadder } from "@/components/vocal/NoteLadder";

/* ============================================================
   CANTARE — Teste de extensão vocal
   Detecção de pitch real via Web Audio API (autocorrelação)
   ============================================================ */

const GOLD = "#B8955A";
const GOLD_DIM = "rgba(184,149,90,0.28)";
const INK = "#07080A";
const PAPER = "#E8E4DC";

const NOTE_NAMES = ["Dó", "Dó#", "Ré", "Ré#", "Mi", "Fá", "Fá#", "Sol", "Sol#", "Lá", "Lá#", "Si"];
const NOTE_LATIN = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const LADDER_LOW = 36;  // C2
const LADDER_HIGH = 84; // C6

const VOICE_TYPES = [
  { name: "Baixo", low: 40, high: 64, desc: "A voz masculina mais grave" },
  { name: "Barítono", low: 45, high: 69, desc: "A voz masculina mais comum" },
  { name: "Tenor", low: 48, high: 72, desc: "A voz masculina mais aguda" },
  { name: "Contralto", low: 53, high: 77, desc: "A voz feminina mais grave" },
  { name: "Mezzo-soprano", low: 57, high: 81, desc: "A voz feminina mais comum" },
  { name: "Soprano", low: 60, high: 84, desc: "A voz feminina mais aguda" },
];

const freqToMidi = (f) => 69 + 12 * Math.log2(f / 440);
const midiToLabel = (m) => {
  const r = Math.round(m);
  return `${NOTE_NAMES[((r % 12) + 12) % 12]}${Math.floor(r / 12) - 1}`;
};
const midiToLatin = (m) => {
  const r = Math.round(m);
  return `${NOTE_LATIN[((r % 12) + 12) % 12]}${Math.floor(r / 12) - 1}`;
};

/* ---------- detecção de pitch por autocorrelação ---------- */
function detectPitch(buf, sampleRate) {
  const SIZE = buf.length;
  let energy = 0;
  for (let i = 0; i < SIZE; i++) energy += buf[i] * buf[i];
  const rms = Math.sqrt(energy / SIZE);
  if (rms < 0.009) return null;
  energy /= SIZE;

  const minLag = Math.max(2, Math.floor(sampleRate / 1100));
  const maxLag = Math.min(SIZE - 2, Math.floor(sampleRate / 65));

  const corrs = new Float32Array(maxLag + 2);
  for (let lag = minLag; lag <= maxLag; lag++) {
    let c = 0;
    const n = SIZE - lag;
    for (let i = 0; i < n; i++) c += buf[i] * buf[i + lag];
    corrs[lag] = c / n;
  }

  let bestLag = -1;
  let bestCorr = 0;
  for (let lag = minLag + 1; lag < maxLag; lag++) {
    if (corrs[lag] > corrs[lag - 1] && corrs[lag] >= corrs[lag + 1] && corrs[lag] > bestCorr) {
      bestCorr = corrs[lag];
      bestLag = lag;
    }
  }
  if (bestLag < 0) return null;

  // corrige erro de oitava: prefere um pico anterior quase tão forte
  for (let lag = minLag + 1; lag < bestLag; lag++) {
    if (
      corrs[lag] > corrs[lag - 1] &&
      corrs[lag] >= corrs[lag + 1] &&
      corrs[lag] > bestCorr * 0.86
    ) {
      bestLag = lag;
      bestCorr = corrs[lag];
      break;
    }
  }

  const clarity = energy > 0 ? bestCorr / energy : 0;
  if (clarity < 0.55) return null;

  const y1 = corrs[bestLag - 1], y2 = corrs[bestLag], y3 = corrs[bestLag + 1];
  const denom = 2 * (2 * y2 - y1 - y3);
  const shift = denom !== 0 ? (y3 - y1) / denom : 0;
  const freq = sampleRate / (bestLag + shift);

  if (freq < 65 || freq > 1100) return null;
  return { freq, clarity, rms };
}

/* ============================================================ */
export default function TesteVocalCantare() {
  const [stage, setStage] = useState("intro"); // intro|noise|low|high|result
  const [err, setErr] = useState(null);
  const [live, setLive] = useState(null);
  const [amp, setAmp] = useState(0);
  const [noise, setNoise] = useState(null);
  const [noiseVal, setNoiseVal] = useState(0);
  const [low, setLow] = useState(null);
  const [high, setHigh] = useState(null);
  const [held, setHeld] = useState(0);

  const ctxRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const bufRef = useRef(null);
  const histRef = useRef([]);
  const stageRef = useRef("intro");
  const extremeRef = useRef({ low: null, high: null });

  useEffect(() => { stageRef.current = stage; }, [stage]);

  const stopAudio = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (ctxRef.current && ctxRef.current.state !== "closed") ctxRef.current.close();
    ctxRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;
  }, []);

  useEffect(() => stopAudio, [stopAudio]);

  const loop = useCallback(() => {
    const analyser = analyserRef.current;
    const ctx = ctxRef.current;
    if (!analyser || !ctx) return;

    analyser.getFloatTimeDomainData(bufRef.current);
    const res = detectPitch(bufRef.current, ctx.sampleRate);

    let rms = 0;
    for (let i = 0; i < bufRef.current.length; i++) rms += bufRef.current[i] ** 2;
    rms = Math.sqrt(rms / bufRef.current.length);
    setAmp(Math.min(1, rms * 9));

    const st = stageRef.current;

    if (st === "noise") {
      setNoiseVal((p) => p * 0.85 + rms * 0.15);
    } else if (st === "low" || st === "high") {
      if (res) {
        const midi = freqToMidi(res.freq);
        const h = histRef.current;
        h.push({ midi, t: performance.now() });
        while (h.length && performance.now() - h[0].t > 420) h.shift();

        setLive(midi);

        // estável = 8+ leituras dentro de ±0.7 semitom
        if (h.length >= 8) {
          const sorted = [...h].map((x) => x.midi).sort((a, b) => a - b);
          const med = sorted[Math.floor(sorted.length / 2)];
          const spread = sorted.filter((v) => Math.abs(v - med) < 0.7).length / sorted.length;
          setHeld(Math.min(1, spread));
          if (spread > 0.75) {
            const e = extremeRef.current;
            if (st === "low" && (e.low == null || med < e.low)) {
              e.low = med;
              setLow(med);
            }
            if (st === "high" && (e.high == null || med > e.high)) {
              e.high = med;
              setHigh(med);
            }
          }
        }
      } else {
        histRef.current = [];
        setLive(null);
        setHeld(0);
      }
    }

    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const startMic = async () => {
    setErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      src.connect(analyser);
      analyserRef.current = analyser;
      bufRef.current = new Float32Array(analyser.fftSize);

      setStage("noise");
      setNoiseVal(0);
      rafRef.current = requestAnimationFrame(loop);

      setTimeout(() => {
        setNoise((prev) => {
          const v = noiseValRef.current;
          return v > 0.028 ? "alto" : v > 0.014 ? "medio" : "ok";
        });
      }, 3200);
    } catch (e) {
      setErr(
        e && e.name === "NotAllowedError"
          ? "Você bloqueou o microfone. Libere o acesso nas configurações do navegador e tente de novo."
          : "Não consegui acessar o microfone neste dispositivo."
      );
    }
  };

  const noiseValRef = useRef(0);
  useEffect(() => { noiseValRef.current = noiseVal; }, [noiseVal]);

  const goto = (s) => {
    histRef.current = [];
    setLive(null);
    setHeld(0);
    setStage(s);
  };

  const restart = () => {
    stopAudio();
    extremeRef.current = { low: null, high: null };
    histRef.current = [];
    setLow(null); setHigh(null); setLive(null);
    setNoise(null); setNoiseVal(0); setHeld(0); setErr(null);
    setStage("intro");
  };

  /* classificação */
  const classify = () => {
    if (low == null || high == null) return null;
    const scored = VOICE_TYPES.map((t) => {
      const overlap = Math.max(0, Math.min(high, t.high) - Math.max(low, t.low));
      const union = Math.max(high, t.high) - Math.min(low, t.low);
      const centerDist = Math.abs((low + high) / 2 - (t.low + t.high) / 2);
      return { ...t, score: overlap / union - centerDist * 0.02 };
    }).sort((a, b) => b.score - a.score);
    return scored[0];
  };

  const result = stage === "result" ? classify() : null;
  const semitones = low != null && high != null ? Math.round(high - low) : 0;

  /* ---------- estilos base ---------- */
  const font = {
    display: "'Newsreader', Georgia, serif",
    ui: "'DM Sans', system-ui, sans-serif",
  };

  const Shell = ({ children }) => (
    <div
      style={{
        minHeight: 620,
        background: INK,
        color: PAPER,
        fontFamily: font.ui,
        position: "relative",
        overflow: "hidden",
        borderRadius: 4,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,600;1,6..72,300&family=DM+Sans:wght@300;400;500&display=swap');
        .cantare-btn { transition: background .25s, color .25s, border-color .25s; }
        .cantare-btn:hover { background: ${GOLD} !important; color: ${INK} !important; }
        .cantare-ghost:hover { color: ${PAPER} !important; }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
      `}</style>
      {children}
    </div>
  );

  const Btn = ({ children, onClick, disabled, primary = true }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={primary ? "cantare-btn" : "cantare-ghost"}
      style={{
        fontFamily: font.ui,
        fontSize: 14,
        padding: primary ? "13px 30px" : "8px 4px",
        background: "transparent",
        color: disabled ? "rgba(232,228,220,0.25)" : primary ? GOLD : "rgba(232,228,220,0.45)",
        border: primary ? `1px solid ${disabled ? "rgba(184,149,90,0.25)" : GOLD}` : "none",
        borderRadius: 2,
        cursor: disabled ? "default" : "pointer",
        letterSpacing: ".01em",
      }}
    >
      {children}
    </button>
  );

  /* ---------- telas ---------- */

  if (stage === "intro") {
    return (
      <Shell>
        <div style={{ padding: "64px 32px", maxWidth: 560 }}>
          <p style={{ fontSize: 12, color: "rgba(232,228,220,0.3)", marginBottom: 28, letterSpacing: ".04em" }}>
            Cantare
          </p>
          <h1
            style={{
              fontFamily: font.display,
              fontWeight: 300,
              fontSize: "clamp(38px, 8vw, 62px)",
              lineHeight: 1.05,
              margin: "0 0 22px",
            }}
          >
            Vamos descobrir<br />o alcance da sua voz.
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.65, color: "rgba(232,228,220,0.55)", maxWidth: 440, margin: "0 0 14px" }}>
            Você vai cantar até a nota mais grave que conseguir, depois até a mais aguda.
            Leva cerca de dois minutos.
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(232,228,220,0.35)", maxWidth: 440, margin: "0 0 40px" }}>
            Procure um lugar silencioso. Fone de ouvido ajuda bastante.
            Não force a voz em nenhum momento — pare se sentir desconforto.
          </p>

          {err && (
            <p style={{ fontSize: 13, color: "#C87F6A", marginBottom: 22, maxWidth: 440, lineHeight: 1.5 }}>
              {err}
            </p>
          )}

          <Btn onClick={startMic}>Liberar microfone e começar</Btn>

          <p style={{ fontSize: 12, color: "rgba(232,228,220,0.22)", marginTop: 34, lineHeight: 1.6, maxWidth: 420 }}>
            O áudio é processado no seu aparelho e não é gravado nem enviado para lugar nenhum.
            Este teste mede performance vocal e não substitui avaliação fonoaudiológica.
          </p>
        </div>
      </Shell>
    );
  }

  if (stage === "noise") {
    const pct = Math.min(100, noiseVal * 1400);
    return (
      <Shell>
        <div style={{ padding: "64px 32px", maxWidth: 520 }}>
          <h2 style={{ fontFamily: font.display, fontWeight: 300, fontSize: 40, margin: "0 0 12px" }}>
            {noise ? "Ambiente medido" : "Ouvindo o ambiente"}
          </h2>
          <p style={{ fontSize: 15, color: "rgba(232,228,220,0.5)", margin: "0 0 42px" }}>
            {noise ? "" : "Fique em silêncio por alguns segundos."}
          </p>

          <div style={{ height: 2, background: "rgba(232,228,220,0.1)", marginBottom: 12, maxWidth: 380 }}>
            <div
              style={{
                height: "100%",
                width: `${pct}%`,
                background: pct > 40 ? "#C87F6A" : GOLD,
                transition: "width .2s ease, background .3s",
              }}
            />
          </div>
          <p style={{ fontSize: 12, color: "rgba(232,228,220,0.3)", marginBottom: 46 }}>
            ruído de fundo
          </p>

          {noise === "ok" && (
            <>
              <p style={{ fontSize: 15, color: GOLD, marginBottom: 26 }}>
                Ambiente silencioso. Pode começar.
              </p>
              <Btn onClick={() => goto("low")}>Continuar</Btn>
            </>
          )}
          {noise === "medio" && (
            <>
              <p style={{ fontSize: 15, color: "rgba(232,228,220,0.6)", marginBottom: 8, maxWidth: 400, lineHeight: 1.5 }}>
                Há algum ruído. O teste funciona, mas o resultado fica menos preciso.
              </p>
              <div style={{ display: "flex", gap: 18, alignItems: "center", marginTop: 20 }}>
                <Btn onClick={() => goto("low")}>Continuar assim</Btn>
                <Btn primary={false} onClick={restart}>Medir de novo</Btn>
              </div>
            </>
          )}
          {noise === "alto" && (
            <>
              <p style={{ fontSize: 15, color: "#C87F6A", marginBottom: 8, maxWidth: 400, lineHeight: 1.5 }}>
                Muito ruído de fundo. O resultado pode sair errado — a Laury já viu isso
                acontecer e dar um tipo vocal trocado.
              </p>
              <div style={{ display: "flex", gap: 18, alignItems: "center", marginTop: 20 }}>
                <Btn onClick={restart}>Procurar um lugar mais quieto</Btn>
                <Btn primary={false} onClick={() => goto("low")}>Continuar assim</Btn>
              </div>
            </>
          )}
        </div>
      </Shell>
    );
  }

  if (stage === "low" || stage === "high") {
    const isLow = stage === "low";
    const captured = isLow ? low : high;
    const other = isLow ? null : low;

    return (
      <Shell>
        <div style={{ display: "flex", height: 620 }}>
          {/* painel */}
          <div style={{ flex: 1, padding: "56px 32px", display: "flex", flexDirection: "column" }}>
            <p style={{ fontSize: 12, color: "rgba(232,228,220,0.3)", marginBottom: 6 }}>
              {isLow ? "Etapa 1 de 2" : "Etapa 2 de 2"}
            </p>
            <h2 style={{ fontFamily: font.display, fontWeight: 300, fontSize: 38, margin: "0 0 10px", lineHeight: 1.1 }}>
              {isLow ? "Desça até sua nota mais grave" : "Suba até sua nota mais aguda"}
            </h2>
            <p style={{ fontSize: 14, color: "rgba(232,228,220,0.45)", margin: "0 0 auto", maxWidth: 320, lineHeight: 1.6 }}>
              Cante um <em style={{ fontFamily: font.display, fontStyle: "italic", fontSize: 17 }}>ah</em> confortável
              e vá {isLow ? "descendo" : "subindo"} devagar. Segure cada nota por um instante.
              Pare quando começar a forçar.
            </p>

            {/* nota ao vivo */}
            <div style={{ margin: "34px 0 26px", minHeight: 118 }}>
              {live != null ? (
                <>
                  <div
                    style={{
                      fontFamily: font.display,
                      fontWeight: 300,
                      fontSize: 76,
                      lineHeight: 1,
                      color: held > 0.75 ? GOLD : PAPER,
                      transition: "color .2s",
                    }}
                  >
                    {midiToLabel(live)}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(232,228,220,0.3)", marginTop: 6 }}>
                    {midiToLatin(live)} · {(440 * Math.pow(2, (live - 69) / 12)).toFixed(1)} Hz
                  </div>
                  <div style={{ marginTop: 14, height: 1, width: 150, background: "rgba(232,228,220,0.12)" }}>
                    <div style={{ height: 1, width: `${held * 100}%`, background: GOLD, transition: "width .12s" }} />
                  </div>
                </>
              ) : (
                <div style={{ fontFamily: font.display, fontSize: 30, fontWeight: 300, color: "rgba(232,228,220,0.18)", fontStyle: "italic" }}>
                  esperando sua voz…
                </div>
              )}
            </div>

            {/* registrado */}
            <div style={{ marginBottom: 26, fontSize: 13, color: "rgba(232,228,220,0.45)" }}>
              {other != null && (
                <div style={{ marginBottom: 6 }}>
                  mais grave · <span style={{ color: GOLD }}>{midiToLabel(other)}</span>
                </div>
              )}
              {captured != null ? (
                <div>
                  {isLow ? "mais grave" : "mais aguda"} ·{" "}
                  <span style={{ color: GOLD }}>{midiToLabel(captured)}</span>
                </div>
              ) : (
                <div style={{ color: "rgba(232,228,220,0.25)" }}>nada registrado ainda</div>
              )}
            </div>

            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <Btn
                disabled={captured == null}
                onClick={() => (isLow ? goto("high") : setStage("result"))}
              >
                {isLow ? "Agora as agudas" : "Ver meu resultado"}
              </Btn>
              <Btn primary={false} onClick={restart}>Recomeçar</Btn>
            </div>
          </div>

          {/* escada */}
          <div style={{ width: 132, padding: "56px 22px 56px 0", position: "relative" }}>
            <NoteLadder
              min={LADDER_LOW}
              max={LADDER_HIGH}
              live={live}
              range={low != null && high != null ? { low, high } : captured != null ? { low: captured, high: captured + 0.4 } : null}
              targetHint={isLow ? "low" : "high"}
            />
          </div>
        </div>
      </Shell>
    );
  }

  /* resultado */
  return (
    <Shell>
      <div style={{ display: "flex", minHeight: 620 }}>
        <div style={{ flex: 1, padding: "56px 32px" }}>
          <p style={{ fontSize: 12, color: "rgba(232,228,220,0.3)", marginBottom: 26 }}>Seu perfil vocal</p>

          <h2
            style={{
              fontFamily: font.display,
              fontWeight: 300,
              fontSize: "clamp(44px, 9vw, 70px)",
              lineHeight: 1,
              margin: "0 0 8px",
              color: GOLD,
            }}
          >
            {result ? result.name : "—"}
          </h2>
          <p style={{ fontSize: 15, color: "rgba(232,228,220,0.5)", margin: "0 0 40px" }}>
            {result ? result.desc : ""}
          </p>

          <div style={{ display: "flex", gap: 46, marginBottom: 40, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: font.display, fontSize: 34, fontWeight: 300 }}>
                {low != null ? midiToLabel(low) : "—"}
              </div>
              <div style={{ fontSize: 12, color: "rgba(232,228,220,0.35)", marginTop: 2 }}>mais grave</div>
            </div>
            <div>
              <div style={{ fontFamily: font.display, fontSize: 34, fontWeight: 300 }}>
                {high != null ? midiToLabel(high) : "—"}
              </div>
              <div style={{ fontSize: 12, color: "rgba(232,228,220,0.35)", marginTop: 2 }}>mais aguda</div>
            </div>
            <div>
              <div style={{ fontFamily: font.display, fontSize: 34, fontWeight: 300 }}>
                {semitones}
              </div>
              <div style={{ fontSize: 12, color: "rgba(232,228,220,0.35)", marginTop: 2 }}>
                semitons {semitones >= 12 ? `· ${(semitones / 12).toFixed(1)} oitavas` : ""}
              </div>
            </div>
          </div>

          {/* comparação com os tipos */}
          <div style={{ marginBottom: 40, maxWidth: 400 }}>
            {VOICE_TYPES.map((t) => {
              const span = LADDER_HIGH - LADDER_LOW;
              const l = ((t.low - LADDER_LOW) / span) * 100;
              const w = ((t.high - t.low) / span) * 100;
              const isMe = result && result.name === t.name;
              return (
                <div key={t.name} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 9 }}>
                  <div
                    style={{
                      width: 104,
                      fontSize: 12,
                      color: isMe ? GOLD : "rgba(232,228,220,0.3)",
                      textAlign: "right",
                    }}
                  >
                    {t.name}
                  </div>
                  <div style={{ flex: 1, height: 3, background: "rgba(232,228,220,0.06)", position: "relative" }}>
                    <div
                      style={{
                        position: "absolute",
                        left: `${l}%`,
                        width: `${w}%`,
                        height: "100%",
                        background: isMe ? GOLD : "rgba(232,228,220,0.14)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {low != null && high != null && (
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 14 }}>
                <div style={{ width: 104, fontSize: 12, color: PAPER, textAlign: "right" }}>sua voz</div>
                <div style={{ flex: 1, height: 3, position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: `${((low - LADDER_LOW) / (LADDER_HIGH - LADDER_LOW)) * 100}%`,
                      width: `${((high - low) / (LADDER_HIGH - LADDER_LOW)) * 100}%`,
                      height: "100%",
                      background: PAPER,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <p style={{ fontSize: 13, color: "rgba(232,228,220,0.4)", lineHeight: 1.7, maxWidth: 430, marginBottom: 30 }}>
            {semitones < 12
              ? "Sua extensão ficou curta. Isso costuma acontecer quando a voz não está aquecida ou o ambiente tem ruído — vale refazer depois de um aquecimento."
              : "A partir daqui os exercícios do Cantare são montados dentro dessa faixa, sem te empurrar para notas que forçam a voz."}
          </p>

          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <Btn onClick={restart}>Refazer o teste</Btn>
          </div>

          <p style={{ fontSize: 11, color: "rgba(232,228,220,0.2)", marginTop: 36, lineHeight: 1.6, maxWidth: 430 }}>
            Análise de performance vocal, não diagnóstico. Em caso de dor, rouquidão ou
            desconforto persistente, procure um fonoaudiólogo.
          </p>
        </div>

        <div style={{ width: 132, padding: "56px 22px 56px 0" }}>
          <NoteLadder min={LADDER_LOW} max={LADDER_HIGH} range={low != null && high != null ? { low, high } : null} />
        </div>
      </div>
    </Shell>
  );
}
