import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ListMusic, Maximize, Minimize, X } from 'lucide-react';
import { getProject, reserveSongs, showSequence, formatSongTime, type SongPlace } from '@/lib/repertoire/store';
import type { RepertoireProject, RepertoireSong } from '@/lib/types';

/**
 * Modo Palco — fora do layout do app: sem sidebar, sem menu, fundo preto.
 * Tudo vem do localStorage já carregado: avançar a lista não usa rede.
 * Wake Lock mantém a tela acesa quando o navegador suporta.
 */
export const Route = createFileRoute('/palco/$projectId')({
  head: () => ({ meta: [{ title: 'Modo Palco — Cantare' }, { name: 'theme-color', content: '#000000' }] }),
  component: StageMode,
});

const SERIF = "'Newsreader', serif";
const SANS = "'DM Sans', sans-serif";
const GOLD = '#C9A15E';

type WakeState = 'on' | 'unsupported' | 'denied' | 'off';

/*
 * Letra no palco (25/09/2026): lida a um braço de distância, no escuro, com o microfone na mão.
 * Única tela do app onde legibilidade ganha de refinamento: sans, branco puro sobre preto,
 * três tamanhos grandes e rolagem por botões de toque grande (ou pedal: setas/Page Up/Down).
 */
const LYRICS_SIZES = ['clamp(28px, 5vw, 44px)', 'clamp(34px, 6.4vw, 56px)', 'clamp(42px, 8vw, 72px)'];
const LYRICS_SIZE_KEY = 'cantare:palco:letra-tamanho';

function StageMode() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<RepertoireProject | null | undefined>(undefined);
  const [index, setIndex] = useState(0);
  const [extra, setExtra] = useState<RepertoireSong | null>(null);
  const [showReserve, setShowReserve] = useState(false);
  const [wake, setWake] = useState<WakeState>('off');
  const [fullscreen, setFullscreen] = useState(false);
  const [pulse, setPulse] = useState(0);
  const lockRef = useRef<WakeLockSentinel | null>(null);
  const touch = useRef<{ x: number; y: number; t: number } | null>(null);
  const [lyricsOn, setLyricsOn] = useState(false);
  const [lyricsSize, setLyricsSize] = useState(1);
  const lyricsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const s = Number(localStorage.getItem(LYRICS_SIZE_KEY));
      if (s >= 0 && s < LYRICS_SIZES.length) setLyricsSize(s);
    } catch { /* ignore */ }
  }, []);
  const cycleLyricsSize = () =>
    setLyricsSize((s) => {
      const n = (s + 1) % LYRICS_SIZES.length;
      try { localStorage.setItem(LYRICS_SIZE_KEY, String(n)); } catch { /* ignore */ }
      return n;
    });
  /** rola ~70% da área visível: o fim do trecho anterior continua à vista */
  const scrollLyrics = useCallback((dir: 1 | -1) => {
    const el = lyricsRef.current;
    if (el) el.scrollBy({ top: dir * el.clientHeight * 0.7, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const p = getProject(projectId);
    setProject(p);
    // Retoma de onde parou se a página for recarregada no meio do show.
    try {
      const saved = Number(sessionStorage.getItem(`cantare:palco:${projectId}`));
      if (p && Number.isFinite(saved) && saved > 0) setIndex(Math.min(saved, showSequence(p).length - 1));
    } catch { /* ignore */ }
  }, [projectId]);

  const seq: SongPlace[] = useMemo(() => (project ? showSequence(project) : []), [project]);
  const reserve = useMemo(() => (project ? reserveSongs(project) : []), [project]);

  useEffect(() => {
    try { sessionStorage.setItem(`cantare:palco:${projectId}`, String(index)); } catch { /* ignore */ }
  }, [index, projectId]);

  /* ---- Wake Lock ---- */
  const requestWake = useCallback(async () => {
    if (!('wakeLock' in navigator)) return setWake('unsupported');
    try {
      lockRef.current = await navigator.wakeLock.request('screen');
      setWake('on');
      lockRef.current.addEventListener('release', () => setWake((w) => (w === 'on' ? 'off' : w)));
    } catch {
      setWake('denied');
    }
  }, []);

  useEffect(() => {
    requestWake();
    const onVis = () => document.visibilityState === 'visible' && requestWake();
    document.addEventListener('visibilitychange', onVis);
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      document.removeEventListener('fullscreenchange', onFs);
      lockRef.current?.release().catch(() => {});
    };
  }, [requestWake]);

  /* ---- navegação ---- */
  const go = useCallback(
    (dir: 1 | -1) => {
      setShowReserve(false);
      if (extra) {
        setExtra(null);
        if (dir === -1) return;
      }
      setIndex((i) => Math.max(0, Math.min(seq.length - 1, i + dir)));
      setPulse((p) => p + 1);
      if ('vibrate' in navigator) navigator.vibrate?.(12);
    },
    [extra, seq.length],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showReserve && e.key === 'Escape') return setShowReserve(false);
      // Com a letra na tela, vertical rola a letra (pedal de virar página manda Page Up/Down) e
      // horizontal troca de música.
      if (lyricsRef.current) {
        if (['ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); return scrollLyrics(1); }
        if (['ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); return scrollLyrics(-1); }
      }
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); go(1); }
      if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); go(-1); }
      if (e.key === 'Escape' && !document.fullscreenElement) navigate({ to: '/repertorio/$projectId', params: { projectId } });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, navigate, projectId, showReserve, scrollLyrics]);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { /* sem suporte: segue normal */ }
  };

  if (project === undefined) return <div className="fixed inset-0 bg-black" />;

  if (!project || seq.length === 0) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-6 bg-black px-6 text-center" style={{ color: '#EDE9E1' }}>
        <p style={{ fontFamily: SERIF, fontSize: 34 }}>{project ? 'Este projeto ainda não tem músicas nos blocos.' : 'Projeto não encontrado.'}</p>
        <Link to={project ? '/repertorio/$projectId' : '/repertorio'} params={project ? { projectId } : undefined as never} className="rounded-[10px] px-6 py-4" style={{ background: GOLD, color: '#000', fontFamily: SANS, fontSize: 18 }}>
          Voltar ao repertório
        </Link>
      </div>
    );
  }

  const cur = extra ? null : seq[index];
  const song = extra ?? cur!.song;
  const next = extra ? seq[index] : seq[index + 1];
  const isLast = !extra && index === seq.length - 1;
  // A letra fica ligada entre músicas: a próxima que tiver letra já abre nela.
  const showLyrics = lyricsOn && !!song.lyrics;

  return (
    <div
      className="fixed inset-0 flex select-none flex-col bg-black"
      style={{ color: '#F2EEE6', paddingBottom: 'env(safe-area-inset-bottom)', paddingTop: 'env(safe-area-inset-top)' }}
      onTouchStart={(e) => { const t = e.touches[0]; touch.current = { x: t.clientX, y: t.clientY, t: Date.now() }; }}
      onTouchEnd={(e) => {
        const s = touch.current; touch.current = null;
        if (!s || showReserve) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - s.x; const dy = t.clientY - s.y;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4 && Date.now() - s.t < 700) go(dx < 0 ? 1 : -1);
      }}
    >
      {/* topo */}
      <header className="flex items-center justify-between gap-3 px-4 pt-3 sm:px-8 sm:pt-6">
        <Link
          to="/repertorio/$projectId"
          params={{ projectId }}
          aria-label="Sair do Modo Palco"
          className="flex h-12 items-center gap-2 rounded-[10px] px-3 text-[rgba(242,238,230,0.6)] outline-none active:scale-95 focus-visible:ring-2 focus-visible:ring-[#C9A15E]"
          style={{ fontFamily: SANS, fontSize: 16 }}
        >
          <X size={22} /> Sair
        </Link>
        <div className="min-w-0 text-center">
          <p className="truncate" style={{ fontFamily: SANS, fontSize: 15, color: 'rgba(242,238,230,0.55)' }}>{project.name}</p>
          <p style={{ fontFamily: SANS, fontSize: 22, color: '#F2EEE6', fontVariantNumeric: 'tabular-nums' }}>
            {extra ? 'Reserva' : `${index + 1} / ${seq.length}`}
          </p>
        </div>
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={fullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
          className="flex h-12 w-12 items-center justify-center rounded-[10px] text-[rgba(242,238,230,0.6)] outline-none active:scale-95 focus-visible:ring-2 focus-visible:ring-[#C9A15E]"
        >
          {fullscreen ? <Minimize size={22} /> : <Maximize size={22} />}
        </button>
      </header>

      {/* letra da música atual */}
      {showLyrics && (
        <main key={`${song.id}-${pulse}-letra`} className="stage-in flex min-h-0 flex-1 flex-col px-5 sm:px-10">
          <div className="flex items-baseline justify-between gap-4 pb-2" style={{ borderBottom: '1px solid rgba(242,238,230,0.15)' }}>
            <p className="min-w-0 truncate" style={{ fontFamily: SANS, fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 600, color: '#FFFFFF' }}>{song.title}</p>
            <p className="shrink-0" style={{ fontFamily: SANS, fontSize: 'clamp(22px, 3.4vw, 32px)', fontWeight: 700, color: song.currentKey ? GOLD : '#8A6A3A' }}>
              Tom {song.currentKey || '?'}
            </p>
          </div>
          <div
            ref={lyricsRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-5"
            style={{ fontFamily: SANS, fontWeight: 500, fontSize: LYRICS_SIZES[lyricsSize], lineHeight: 1.35, color: '#FFFFFF', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
          >
            {song.lyrics}
            {/* folga no fim: a última linha pode subir até o meio da tela */}
            <div aria-hidden style={{ height: '40vh' }} />
          </div>
        </main>
      )}

      {/* música atual */}
      {!showLyrics && <main key={`${song.id}-${pulse}`} className="stage-in flex flex-1 flex-col items-center justify-center gap-4 px-5 text-center sm:gap-6">
        <p style={{ fontFamily: SANS, fontSize: 'clamp(16px, 2.4vw, 22px)', color: GOLD }}>
          {extra ? 'Música de reserva' : cur!.block?.name ? `Bloco ${(cur!.blockIndex ?? 0) + 1} · ${cur!.block.name}` : ''}
        </p>
        <h1 className="max-w-[18ch] break-words" style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(46px, 10vw, 128px)', lineHeight: 0.98, color: '#FFFFFF' }}>
          {song.title}
        </h1>
        {song.artist && <p style={{ fontFamily: SERIF, fontSize: 'clamp(22px, 3.6vw, 40px)', color: 'rgba(242,238,230,0.72)' }}>{song.artist}</p>}
        <div className="mt-2 flex items-center gap-6">
          <div className="flex min-w-[140px] flex-col items-center rounded-[16px] px-8 py-3" style={{ border: `2px solid ${song.currentKey ? GOLD : '#8A6A3A'}` }}>
            <span style={{ fontFamily: SANS, fontSize: 16, color: 'rgba(242,238,230,0.6)' }}>Tom</span>
            <span style={{ fontFamily: SERIF, fontSize: 'clamp(64px, 12vw, 120px)', lineHeight: 1, color: song.currentKey ? GOLD : '#8A6A3A' }}>{song.currentKey || '?'}</span>
          </div>
          {song.durationSec ? (
            <div className="hidden flex-col items-start sm:flex">
              <span style={{ fontFamily: SANS, fontSize: 16, color: 'rgba(242,238,230,0.5)' }}>Duração</span>
              <span style={{ fontFamily: SANS, fontSize: 28, color: 'rgba(242,238,230,0.8)', fontVariantNumeric: 'tabular-nums' }}>{formatSongTime(song.durationSec)}</span>
            </div>
          ) : null}
        </div>
        {song.vocalNote && <p className="max-w-xl" style={{ fontFamily: SANS, fontSize: 18, color: 'rgba(242,238,230,0.6)' }}>{song.vocalNote}</p>}
        {song.lyrics && (
          <button
            type="button"
            onClick={() => setLyricsOn(true)}
            className="mt-1 flex h-16 items-center justify-center rounded-[14px] px-8 outline-none active:scale-[0.97] focus-visible:ring-4 focus-visible:ring-white/50"
            style={{ border: `2px solid ${GOLD}`, color: '#FFFFFF', fontFamily: SANS, fontSize: 22, fontWeight: 600 }}
          >
            Ver letra
          </button>
        )}
      </main>}

      {/* rolagem da letra: botões grandes, para o polegar com o microfone na outra mão */}
      {showLyrics && (
        <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)] gap-2 px-4 pb-3 sm:gap-3 sm:px-8">
          <StageButton onClick={() => scrollLyrics(-1)} label="Subir a letra">
            <ChevronUp size={40} />
          </StageButton>
          <StageButton onClick={cycleLyricsSize} label={`Tamanho da letra (${lyricsSize + 1} de ${LYRICS_SIZES.length})`}>
            <span style={{ fontFamily: SANS, fontSize: 30, fontWeight: 700 }}>Aa</span>
          </StageButton>
          <StageButton onClick={() => setLyricsOn(false)} label="Fechar letra">
            <X size={30} />
            <span style={{ fontFamily: SANS, fontSize: 13 }}>Letra</span>
          </StageButton>
          <StageButton onClick={() => scrollLyrics(1)} label="Descer a letra">
            <ChevronDown size={40} />
          </StageButton>
        </div>
      )}

      {/* depois — some com a letra aberta: o espaço vertical vai para a letra */}
      {!showLyrics && <p className="px-5 pb-3 text-center" style={{ fontFamily: SANS, fontSize: 'clamp(16px, 2vw, 20px)', color: 'rgba(242,238,230,0.5)' }}>
        {next ? <>Depois: <span style={{ color: 'rgba(242,238,230,0.85)' }}>{next.song.title}</span>{next.song.currentKey ? ` · ${next.song.currentKey}` : ''}</> : 'Última música do show'}
      </p>}

      {/* controles */}
      <nav className="grid grid-cols-[72px_minmax(0,1fr)_72px] gap-2 px-4 sm:gap-3 pb-4 sm:grid-cols-[120px_1fr_120px] sm:px-8 sm:pb-8" aria-label="Controles do palco">
        <StageButton onClick={() => go(-1)} disabled={!extra && index === 0} label="Música anterior">
          <ChevronLeft size={36} />
        </StageButton>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={isLast}
          className="flex h-[88px] min-w-0 items-center justify-center gap-3 rounded-[18px] outline-none transition-[transform,filter] duration-100 active:scale-[0.97] active:brightness-90 disabled:opacity-40 focus-visible:ring-4 focus-visible:ring-white/60 sm:h-[104px]"
          style={{ background: GOLD, color: '#000', fontFamily: SANS, fontSize: 'clamp(19px, 3vw, 30px)', fontWeight: 600, whiteSpace: 'nowrap' }}
        >
          {isLast ? 'Fim do show' : extra ? 'Voltar ao show' : 'Próxima música'} {/* seta só com espaço: em 360 px ela empurrava a Reserva para fora da tela */}{!isLast && <ChevronRight size={32} className="hidden shrink-0 sm:block" />}
        </button>
        <StageButton onClick={() => setShowReserve(true)} disabled={reserve.length === 0} label={`Músicas de reserva (${reserve.length})`}>
          <ListMusic size={30} />
          <span style={{ fontFamily: SANS, fontSize: 13 }}>Reserva</span>
        </StageButton>
      </nav>

      {wake !== 'on' && (
        <p className="pb-3 text-center" style={{ fontFamily: SANS, fontSize: 13, color: 'rgba(242,238,230,0.45)' }}>
          {wake === 'unsupported' ? 'Este navegador não mantém a tela acesa: ajuste o bloqueio automático do aparelho.' : 'A tela pode apagar sozinha.'}{' '}
          {wake !== 'unsupported' && <button type="button" onClick={requestWake} className="underline underline-offset-4" style={{ color: GOLD }}>Manter tela acesa</button>}
        </p>
      )}

      {/* reserva */}
      {showReserve && (
        <div className="fixed inset-0 z-10 flex flex-col bg-black/95 px-4 py-4 sm:px-8 sm:py-8" role="dialog" aria-label="Músicas de reserva">
          <div className="flex items-center justify-between">
            <p style={{ fontFamily: SERIF, fontSize: 34 }}>Reserva</p>
            <StageButton onClick={() => setShowReserve(false)} label="Fechar reserva"><X size={30} /></StageButton>
          </div>
          <ul className="mt-4 flex-1 space-y-2 overflow-y-auto">
            {reserve.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => { setExtra(s); setShowReserve(false); setPulse((p) => p + 1); }}
                  className="flex w-full items-center justify-between gap-4 rounded-[14px] px-5 py-5 text-left outline-none active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[#C9A15E]"
                  style={{ border: '1px solid rgba(242,238,230,0.15)' }}
                >
                  <span className="min-w-0">
                    <span className="block truncate" style={{ fontFamily: SERIF, fontSize: 28, color: '#fff' }}>{s.title}</span>
                    {s.artist && <span className="block truncate" style={{ fontFamily: SANS, fontSize: 16, color: 'rgba(242,238,230,0.6)' }}>{s.artist}</span>}
                  </span>
                  <span style={{ fontFamily: SERIF, fontSize: 40, color: s.currentKey ? GOLD : '#8A6A3A' }}>{s.currentKey || '?'}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <style>{`
        .stage-in { animation: stage-in 180ms ease-out 1; }
        @keyframes stage-in { from { opacity: .3; transform: translateY(6px) } to { opacity: 1; transform: none } }
        @media (prefers-reduced-motion: reduce) { .stage-in { animation: none } }
      `}</style>
    </div>
  );
}

function StageButton({ onClick, disabled, label, children }: { onClick: () => void; disabled?: boolean; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-[88px] flex-col items-center justify-center gap-1 rounded-[18px] outline-none transition-transform duration-100 active:scale-[0.95] disabled:opacity-30 focus-visible:ring-4 focus-visible:ring-white/50 sm:h-[104px]"
      style={{ border: '1.5px solid rgba(242,238,230,0.22)', color: '#F2EEE6' }}
    >
      {children}
    </button>
  );
}
