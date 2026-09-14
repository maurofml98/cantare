import type { CSSProperties } from 'react';

type Props = {
  ex: { name: string; objective: string; duration: number; focus: string };
  status: 'idle' | 'running' | 'paused' | 'done';
  intensity: number;
  elapsed: number;
  total: number;
  onToggle: () => void;
};

const panelBg: CSSProperties = {
  background: 'linear-gradient(180deg, rgba(15,15,18,0.78) 0%, rgba(11,11,14,0.72) 100%)',
  backdropFilter: 'blur(14px)',
  border: '1px solid rgba(184,149,90,0.16)',
  boxShadow: '0 30px 80px -30px rgba(0,0,0,0.75)',
};

const overline: CSSProperties = {
  fontSize: 9,
  letterSpacing: '0.32em',
  fontWeight: 400,
  color: 'rgba(184,149,90,0.8)',
  textTransform: 'uppercase',
};

const displayFont = {
  fontFamily: 'Cormorant Garamond, serif',
  fontWeight: 300,
};

/** Cantos ornamentais em latão */
function Corners() {
  const c = (pos: string): CSSProperties => ({
    position: 'absolute',
    width: 10,
    height: 10,
    borderColor: 'rgba(184,149,90,0.5)',
    ...(pos === 'tl' && { top: 6, left: 6, borderTop: '1px solid', borderLeft: '1px solid' }),
    ...(pos === 'tr' && { top: 6, right: 6, borderTop: '1px solid', borderRight: '1px solid' }),
    ...(pos === 'bl' && { bottom: 6, left: 6, borderBottom: '1px solid', borderLeft: '1px solid' }),
    ...(pos === 'br' && { bottom: 6, right: 6, borderBottom: '1px solid', borderRight: '1px solid' }),
  });
  return (
    <>
      <span style={c('tl')} /><span style={c('tr')} />
      <span style={c('bl')} /><span style={c('br')} />
    </>
  );
}

export function WarmupInstrumentHUD({ ex, status, intensity, elapsed, total, onToggle }: Props) {
  const flow = Math.min(1, 0.4 + intensity * 1.4);
  const remaining = Math.max(0, total - elapsed);
  const mm = Math.floor(remaining / 60);
  const ss = String(remaining % 60).padStart(2, '0');
  const bpm = 60;

  return (
    <>
      {/* ================= DESKTOP — painéis laterais ================= */}
      {/* Painel esquerdo */}
      <aside className="hidden lg:block pointer-events-auto absolute left-6 top-1/2 -translate-y-1/2 z-20 w-[260px]">
        <div className="relative rounded-2xl p-6" style={panelBg}>
          <Corners />
          <p style={overline}>Exercício</p>
          <h2 style={{ ...displayFont, fontSize: 26, color: '#fff', marginTop: 6, lineHeight: 1.1 }}>
            {ex.name}
          </h2>
          <p className="mt-3 text-[12px] text-[#B8B8C0]" style={{ fontWeight: 300, lineHeight: 1.5 }}>
            {ex.objective}
          </p>

          <div
            className="my-5 flex items-center gap-2"
            style={{ color: 'rgba(184,149,90,0.55)' }}
          >
            <span className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(184,149,90,0.4), transparent)' }} />
            <span style={{ fontSize: 10 }}>◆</span>
            <span className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(184,149,90,0.4), transparent)' }} />
          </div>

          <ul className="space-y-4">
            <li className="flex items-center gap-3">
              <span
                className="grid place-items-center h-8 w-8 rounded-full"
                style={{ border: '1px solid rgba(184,149,90,0.35)', color: '#B8955A' }}
                aria-hidden
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </span>
              <div>
                <p className="text-[13px] text-white" style={{ fontWeight: 400 }}>
                  {ex.duration >= 60 ? `${Math.round(ex.duration / 60)} min` : `${ex.duration}s`}
                </p>
                <p className="text-[9px] uppercase text-[#8A8A95]" style={{ letterSpacing: '0.24em' }}>Duração</p>
              </div>
            </li>
            <li className="flex items-center gap-3">
              <span
                className="grid place-items-center h-8 w-8 rounded-full"
                style={{ border: '1px solid rgba(184,149,90,0.35)', color: '#B8955A' }}
                aria-hidden
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M8 4c-1.5 2-2 4-2 6s.5 4 2 6M16 4c1.5 2 2 4 2 6s-.5 4-2 6M12 5v14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </span>
              <div>
                <p className="text-[13px] text-white" style={{ fontWeight: 400 }}>{ex.focus}</p>
                <p className="text-[9px] uppercase text-[#8A8A95]" style={{ letterSpacing: '0.24em' }}>Foco principal</p>
              </div>
            </li>
          </ul>
        </div>
      </aside>

      {/* Painel direito */}
      <aside className="hidden lg:flex pointer-events-auto absolute right-6 top-1/2 -translate-y-1/2 z-20 w-[240px] flex-col gap-4">
        <div className="rounded-2xl p-5 relative" style={panelBg}>
          <Corners />
          <p style={overline}>Intensidade</p>
          <p style={{ ...displayFont, fontSize: 32, color: '#fff', lineHeight: 1 }} className="mt-2">
            {Math.round(intensity * 100)}%
          </p>
          <div className="mt-3 h-1 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div
              className="h-full"
              style={{
                width: `${Math.round(intensity * 100)}%`,
                background: 'linear-gradient(to right, #B8955A, #E8C97E)',
                boxShadow: `0 0 ${6 + intensity * 14}px rgba(232,201,126,${0.35 + intensity * 0.5})`,
                transition: 'width 160ms ease-out',
              }}
            />
          </div>
        </div>

        <div className="rounded-2xl p-5 relative" style={panelBg}>
          <Corners />
          <p style={overline}>Fluxo</p>
          <p style={{ ...displayFont, fontSize: 32, color: '#fff', lineHeight: 1 }} className="mt-2">
            {Math.round(flow * 100)}%
          </p>
          <svg viewBox="0 0 100 20" className="mt-3 w-full h-5" preserveAspectRatio="none">
            <path
              d={`M0 10 Q 12 ${10 - flow * 6}, 25 10 T 50 10 T 75 10 T 100 10`}
              stroke="#B8955A"
              strokeWidth="1"
              fill="none"
              style={{ filter: 'drop-shadow(0 0 3px rgba(232,201,126,0.6))' }}
            />
          </svg>
        </div>

        <div className="rounded-2xl p-5 relative" style={panelBg}>
          <Corners />
          <div className="flex items-center gap-2">
            <span style={{ color: '#B8955A', fontSize: 12 }}>✦</span>
            <p style={overline}>Dica</p>
          </div>
          <p className="mt-2 text-[12px] text-[#B8B8C0] italic" style={{ fontWeight: 300, lineHeight: 1.5 }}>
            Inspire pelo nariz, expire com controle. Sinta o ar sustentando o som.
          </p>
        </div>
      </aside>

      {/* ================= BOTTOM DOCK premium — desktop & mobile ================= */}
      <div
        className="pointer-events-auto absolute bottom-0 left-0 right-0 z-30 px-4 md:px-8"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
      >
        <div
          className="mx-auto max-w-[860px] rounded-[28px] px-4 md:px-8 py-4 md:py-5 relative"
          style={{
            background:
              'linear-gradient(180deg, rgba(20,18,15,0.85) 0%, rgba(11,10,9,0.9) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(184,149,90,0.28)',
            boxShadow:
              '0 -20px 60px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,240,200,0.04) inset, 0 40px 90px -40px rgba(184,149,90,0.35)',
          }}
        >
          {/* hairline dourada topo */}
          <div
            className="absolute top-0 left-8 right-8 h-px"
            style={{
              background:
                'linear-gradient(to right, transparent, rgba(232,201,126,0.6) 20%, rgba(232,201,126,0.9) 50%, rgba(232,201,126,0.6) 80%, transparent)',
            }}
          />

          <div className="flex items-center justify-between gap-3 md:gap-6">
            {/* TEMPO */}
            <DockCell label="Tempo" hideLabelOnMobile={false}>
              <div className="flex items-center gap-2">
                <span style={{ color: '#B8955A', fontSize: 14 }}>♪</span>
                <div>
                  <p style={{ ...displayFont, fontSize: 22, color: '#fff', lineHeight: 1 }}>
                    {status === 'idle' ? bpm : `${mm}:${ss}`}
                  </p>
                  <p className="text-[8px] uppercase text-[#8A8A95] mt-0.5" style={{ letterSpacing: '0.24em' }}>
                    {status === 'idle' ? 'BPM' : 'restam'}
                  </p>
                </div>
              </div>
            </DockCell>

            {/* INTENSIDADE — dial circular */}
            <DockCell label="Intensidade" hideOnMobile>
              <div className="relative h-11 w-11">
                <svg viewBox="0 0 44 44" className="absolute inset-0 -rotate-90">
                  <circle cx="22" cy="22" r="18" stroke="rgba(255,255,255,0.08)" strokeWidth="2" fill="none" />
                  <circle
                    cx="22" cy="22" r="18"
                    stroke="#B8955A"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 18}
                    strokeDashoffset={2 * Math.PI * 18 * (1 - intensity)}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 160ms ease-out', filter: 'drop-shadow(0 0 4px rgba(232,201,126,0.5))' }}
                  />
                </svg>
              </div>
            </DockCell>

            {/* Botão central */}
            <button
              onClick={onToggle}
              disabled={status === 'done'}
              className="group relative shrink-0 rounded-full transition-[transform,filter,box-shadow] duration-200 ease-out hover:brightness-110 hover:-translate-y-[1px] active:scale-95 active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8C97E]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07080A] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:brightness-100"
              style={{
                width: 76,
                height: 76,
                background:
                  'radial-gradient(circle at 40% 30%, #F0D78C 0%, #C9A867 45%, #8B6A38 100%)',
                boxShadow:
                  '0 0 0 1px rgba(255,240,200,0.5) inset, 0 2px 0 rgba(255,240,200,0.35) inset, 0 -3px 6px rgba(0,0,0,0.35) inset, 0 18px 40px -12px rgba(184,149,90,0.7), 0 0 40px rgba(232,201,126,0.35)',
              }}
              aria-label={status === 'idle' ? 'Iniciar' : status === 'running' ? 'Pausar' : 'Retomar'}
            >
              <span className="absolute inset-1.5 rounded-full" style={{ border: '1px solid rgba(0,0,0,0.25)' }} />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background:
                    'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.35), transparent 55%)',
                }}
              />
              <span className="relative flex flex-col items-center justify-center h-full text-[#1A0F00]">
                {status === 'running' ? (
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><rect x="4" y="3" width="3" height="10" rx="0.6" /><rect x="9" y="3" width="3" height="10" rx="0.6" /></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3.2v9.6a.6.6 0 0 0 .93.5l7.36-4.8a.6.6 0 0 0 0-1L5.93 2.7A.6.6 0 0 0 5 3.2Z" /></svg>
                )}
                <span className="text-[8px] mt-0.5" style={{ letterSpacing: '0.3em', fontWeight: 600 }}>
                  {status === 'idle' ? 'INICIAR' : status === 'running' ? 'PAUSAR' : 'RETOMAR'}
                </span>
              </span>
            </button>

            {/* FLUXO */}
            <DockCell label="Fluxo" hideOnMobile>
              <div className="flex items-center gap-1.5" style={{ color: '#B8955A' }}>
                <svg width="26" height="14" viewBox="0 0 26 14" fill="none">
                  <path d="M1 7 Q 4 2, 7 7 T 13 7 T 19 7 T 25 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  <path d="M1 11 Q 4 8, 7 11 T 13 11 T 19 11 T 25 11" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
                </svg>
                <span className="text-[10px] text-[#B8B8C0] uppercase" style={{ letterSpacing: '0.14em' }}>Médio</span>
              </div>
            </DockCell>

            {/* STATUS */}
            <DockCell label="Status">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{
                    background: status === 'running' ? '#E8C97E' : status === 'paused' ? '#8A8A95' : '#B8955A',
                    boxShadow: status === 'running'
                      ? `0 0 ${4 + intensity * 12}px rgba(232,201,126,0.9)`
                      : '0 0 6px rgba(184,149,90,0.5)',
                    animation: status === 'running' ? 'statusPulse 1.8s ease-in-out infinite' : undefined,
                  }}
                />
                <p className="text-[11px] uppercase text-white" style={{ letterSpacing: '0.14em', fontWeight: 400 }}>
                  {status === 'idle' ? 'Pronto' : status === 'running' ? 'Em cena' : status === 'paused' ? 'Pausa' : 'Fim'}
                </p>
              </div>
            </DockCell>
          </div>

          <style>{`
            @keyframes statusPulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.35); }
            }
          `}</style>
        </div>
      </div>
    </>
  );
}

function DockCell({
  label,
  children,
  hideOnMobile,
  hideLabelOnMobile,
}: {
  label: string;
  children: React.ReactNode;
  hideOnMobile?: boolean;
  hideLabelOnMobile?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center gap-1.5 ${hideOnMobile ? 'hidden sm:flex' : ''}`}>
      <span
        className={hideLabelOnMobile ? 'hidden sm:block' : ''}
        style={{
          fontSize: 8,
          letterSpacing: '0.32em',
          color: 'rgba(184,149,90,0.8)',
          textTransform: 'uppercase',
          fontWeight: 400,
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}
