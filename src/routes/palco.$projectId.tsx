import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ListMusic, LogOut, Maximize, Minimize, X } from 'lucide-react';
import { getProject, reserveSongs, showSequence, formatSongTime, type SongPlace } from '@/lib/repertoire/store';
import { isStageMode, loadPosition, resumeIndex, savePosition, type StageMode } from '@/lib/palco/position';
import type { RepertoireProject, RepertoireSong } from '@/lib/types';

/**
 * Modo Palco (redesenho de 25/09/2026) — um produto dentro do produto: sem sidebar, sem menu,
 * sempre escuro (`.palco` em index.css). Três modos com um toque: FOCO, LISTA, LETRA.
 * Tudo vem do aparelho: avançar não usa rede. Wake Lock mantém a tela acesa quando dá.
 * A posição fica salva: sair sem querer e voltar retoma do mesmo ponto.
 */
export const Route = createFileRoute('/palco/$projectId')({
  head: () => ({ meta: [{ title: 'Modo Palco — Cantare' }, { name: 'theme-color', content: '#020812' }] }),
  component: StagePage,
});

type WakeState = 'on' | 'unsupported' | 'denied' | 'off';

const MODES: { id: StageMode; label: string }[] = [
  { id: 'foco', label: 'Foco' },
  { id: 'lista', label: 'Lista' },
  { id: 'letra', label: 'Letra' },
];

/* Letra lida a um braço de distância, no escuro, com o microfone na mão. */
const LYRICS_SIZES = ['clamp(28px, 5vw, 44px)', 'clamp(34px, 6.4vw, 56px)', 'clamp(42px, 8vw, 72px)'];
const LYRICS_SIZE_KEY = 'cantare:palco:letra-tamanho';

function StagePage() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<RepertoireProject | null | undefined>(undefined);
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<StageMode>('foco');
  const [extra, setExtra] = useState<RepertoireSong | null>(null);
  const [showReserve, setShowReserve] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [wake, setWake] = useState<WakeState>('off');
  const [fullscreen, setFullscreen] = useState(false);
  const [pulse, setPulse] = useState(0);
  const [lyricsSize, setLyricsSize] = useState(1);
  const lockRef = useRef<WakeLockSentinel | null>(null);
  const touch = useRef<{ x: number; y: number; t: number } | null>(null);
  const lyricsRef = useRef<HTMLDivElement | null>(null);
  const restored = useRef(false);

  /* ---- carregar projeto e retomar posição ---- */
  useEffect(() => {
    const p = getProject(projectId);
    setProject(p);
    if (!p) return;
    const saved = loadPosition(projectId);
    setIndex(resumeIndex(showSequence(p).map((s) => s.song.id), saved));
    if (saved && isStageMode(saved.displayMode)) setMode(saved.displayMode);
    try {
      const s = Number(localStorage.getItem(LYRICS_SIZE_KEY));
      if (s >= 0 && s < LYRICS_SIZES.length) setLyricsSize(s);
    } catch { /* ignore */ }
    restored.current = true;
  }, [projectId]);

  const seq: SongPlace[] = useMemo(() => (project ? showSequence(project) : []), [project]);
  const reserve = useMemo(() => (project ? reserveSongs(project) : []), [project]);

  useEffect(() => {
    if (!restored.current || !seq[index]) return;
    const cur = seq[index];
    savePosition({ projectId, songId: cur.song.id, blockId: cur.block?.id ?? null, songIndex: index, displayMode: mode });
  }, [index, mode, seq, projectId]);

  /* ---- Wake Lock: pede de novo ao voltar do segundo plano ---- */
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
        // tocando uma reserva: qualquer direção volta para a música do show onde parou
        setExtra(null);
        setPulse((p) => p + 1);
        return;
      }
      setIndex((i) => Math.max(0, Math.min(seq.length - 1, i + dir)));
      setPulse((p) => p + 1);
      if ('vibrate' in navigator) navigator.vibrate?.(12);
    },
    [extra, seq.length],
  );
  const jump = (i: number) => {
    setExtra(null);
    setIndex(i);
    setPulse((p) => p + 1);
  };

  const scrollLyrics = useCallback((dir: 1 | -1) => {
    const el = lyricsRef.current;
    if (el) el.scrollBy({ top: dir * el.clientHeight * 0.7, behavior: 'smooth' });
  }, []);
  const cycleLyricsSize = () =>
    setLyricsSize((s) => {
      const n = (s + 1) % LYRICS_SIZES.length;
      try { localStorage.setItem(LYRICS_SIZE_KEY, String(n)); } catch { /* ignore */ }
      return n;
    });

  const exit = useCallback(() => navigate({ to: '/repertorio/$projectId', params: { projectId } }), [navigate, projectId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (confirmExit) {
        if (e.key === 'Escape') setConfirmExit(false);
        return;
      }
      if (showReserve) {
        if (e.key === 'Escape') setShowReserve(false);
        return;
      }
      if (['1', '2', '3'].includes(e.key)) return setMode(MODES[Number(e.key) - 1].id);
      // Na letra, vertical rola (pedal de virar página manda Page Up/Down) e horizontal troca música.
      if (lyricsRef.current) {
        if (['ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); return scrollLyrics(1); }
        if (['ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); return scrollLyrics(-1); }
      }
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); go(1); }
      if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); go(-1); }
      if (e.key === 'Escape' && !document.fullscreenElement) setConfirmExit(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, scrollLyrics, showReserve, confirmExit]);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { /* sem suporte: segue normal */ }
  };

  if (project === undefined) return <div className="palco fixed inset-0" />;

  if (!project || seq.length === 0) {
    return (
      <div className="palco fixed inset-0 flex flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="text-[28px] font-extrabold sm:text-[36px]">{project ? 'Este show ainda não tem músicas nos blocos.' : 'Show não encontrado.'}</p>
        <Link
          to={project ? '/repertorio/$projectId' : '/repertorio'}
          params={project ? { projectId } : (undefined as never)}
          className="s-focus s-press rounded-[16px] px-8 py-5 text-[18px] font-bold"
          style={{ background: 'var(--s-primary-fill)', color: '#fff' }}
        >
          Voltar ao repertório
        </Link>
      </div>
    );
  }

  const cur = extra ? null : seq[index];
  const song = extra ?? cur!.song;
  const next = extra ? seq[index] : seq[index + 1];
  const isFirst = !extra && index === 0;
  const isLast = !extra && index === seq.length - 1;

  return (
    <div
      className="palco fixed inset-0 flex select-none flex-col"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)', paddingTop: 'env(safe-area-inset-top)' }}
      onTouchStart={(e) => {
        const t = e.touches[0];
        touch.current = { x: t.clientX, y: t.clientY, t: Date.now() };
      }}
      onTouchEnd={(e) => {
        const s = touch.current;
        touch.current = null;
        if (!s || showReserve || confirmExit) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - s.x;
        const dy = t.clientY - s.y;
        // só gesto claramente horizontal troca música — rolar a letra (vertical) nunca troca
        if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6 && Date.now() - s.t < 700) go(dx < 0 ? 1 : -1);
      }}
    >
      {/* ===== topo ===== */}
      <header className="flex flex-col gap-2 px-3 pt-3 sm:px-6 sm:pt-5">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => setConfirmExit(true)}
            className="s-focus s-press flex min-h-[48px] items-center gap-2 rounded-[12px] px-3 text-[16px] font-semibold"
            style={{ color: 'var(--s-muted)', border: '1px solid var(--s-border)' }}
          >
            <LogOut size={18} aria-hidden /> Sair
          </button>
          <ModeSwitcher mode={mode} onChange={setMode} />
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={fullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
            className="s-focus s-press flex h-12 w-12 items-center justify-center rounded-[12px]"
            style={{ color: 'var(--s-muted)', border: '1px solid var(--s-border)' }}
          >
            {fullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>
        <div className="flex items-center justify-between gap-3 px-1 text-[14px] sm:text-[15px]" style={{ color: 'var(--s-muted)' }}>
          <span className="min-w-0 truncate">{project.name}</span>
          <WakeStatus wake={wake} onRetry={requestWake} />
        </div>
      </header>

      {/* ===== conteúdo do modo ===== */}
      <main key={`${mode}-${song.id}-${pulse}`} className="s-in flex min-h-0 flex-1 flex-col">
        {mode === 'foco' && <StageFocus song={song} cur={cur} total={seq.length} next={next?.song} isExtra={!!extra} />}
        {mode === 'lista' && <StageList seq={seq} index={extra ? -1 : index} extra={extra} onJump={jump} />}
        {mode === 'letra' && (
          <StageLyrics song={song} lyricsRef={lyricsRef} size={lyricsSize} onScroll={scrollLyrics} onCycleSize={cycleLyricsSize} onLater={() => setMode('foco')} />
        )}
      </main>

      {/* ===== navegação: alvos grandes, uma mão ===== */}
      <nav className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_72px] gap-2 px-3 pb-3 pt-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_104px] sm:gap-3 sm:px-6 sm:pb-6" aria-label="Controles do palco">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={isFirst}
          className="s-focus s-press flex min-h-[76px] items-center justify-center gap-1 rounded-[18px] text-[18px] font-bold disabled:opacity-30 sm:min-h-[96px] sm:text-[22px]"
          style={{ border: '1.5px solid var(--s-border)', color: 'var(--s-text)', background: 'var(--s-surface)' }}
        >
          <ChevronLeft size={30} aria-hidden /> Anterior
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={isLast}
          className="s-focus s-press flex min-h-[76px] items-center justify-center gap-1 rounded-[18px] text-[20px] font-extrabold disabled:opacity-40 sm:min-h-[96px] sm:text-[26px]"
          style={{ background: 'var(--s-primary-fill)', color: '#fff' }}
        >
          {isLast ? 'Fim do show' : extra ? 'Voltar ao show' : 'Próxima'} {!isLast && <ChevronRight size={32} aria-hidden />}
        </button>
        <button
          type="button"
          onClick={() => setShowReserve(true)}
          disabled={reserve.length === 0}
          aria-label={`Músicas de reserva (${reserve.length})`}
          className="s-focus s-press flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-[18px] disabled:opacity-30 sm:min-h-[96px]"
          style={{ border: '1.5px solid var(--s-border)', color: 'var(--s-text)', background: 'var(--s-surface)' }}
        >
          <ListMusic size={26} aria-hidden />
          <span className="text-[12px] font-semibold">Reserva</span>
        </button>
      </nav>

      {showReserve && (
        <ReserveSheet
          reserve={reserve}
          onClose={() => setShowReserve(false)}
          onPick={(s) => {
            setExtra(s);
            setShowReserve(false);
            setPulse((p) => p + 1);
          }}
        />
      )}

      {confirmExit && <ExitConfirm onStay={() => setConfirmExit(false)} onExit={exit} />}
    </div>
  );
}

/* ======================================================================= */

function ModeSwitcher({ mode, onChange }: { mode: StageMode; onChange: (m: StageMode) => void }) {
  return (
    <div role="radiogroup" aria-label="Modo de exibição" className="mx-auto grid w-full max-w-[420px] grid-cols-3 gap-1 rounded-[14px] p-1" style={{ background: 'var(--s-surface)', border: '1px solid var(--s-border)' }}>
      {MODES.map((m) => {
        const on = mode === m.id;
        return (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(m.id)}
            className="s-focus min-h-[44px] rounded-[10px] text-[14px] font-extrabold uppercase tracking-[0.06em] sm:text-[16px]"
            style={on ? { background: 'var(--s-text)', color: 'var(--s-bg)' } : { color: 'var(--s-muted)' }}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

function WakeStatus({ wake, onRetry }: { wake: WakeState; onRetry: () => void }) {
  if (wake === 'on') {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-semibold" style={{ color: 'var(--s-live)' }}>
        <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: 'var(--s-live)' }} /> Tela ativa
      </span>
    );
  }
  if (wake === 'unsupported') {
    return <span className="shrink-0 text-right text-[13px]">Tela pode apagar: ajuste o bloqueio do aparelho</span>;
  }
  return (
    <button type="button" onClick={onRetry} className="s-focus shrink-0 rounded-[8px] px-2 py-1 text-[13px] font-bold underline underline-offset-4" style={{ color: 'var(--s-pending)' }}>
      Tela pode apagar · manter acesa
    </button>
  );
}

function KeyValue({ value, size }: { value: string; size: string }) {
  return value ? (
    <span className="font-extrabold tabular-nums" style={{ fontSize: size, lineHeight: 0.9, color: 'var(--s-key)', letterSpacing: '-0.02em' }}>{value}</span>
  ) : (
    <span className="font-extrabold" style={{ fontSize: `calc(${size} * 0.32)`, lineHeight: 1, color: 'var(--s-pending)' }}>sem tom</span>
  );
}

/* ---- FOCO: nome, artista, tom gigante, onde estou, próxima ---- */
function StageFocus({ song, cur, total, next, isExtra }: { song: RepertoireSong; cur: SongPlace | null; total: number; next?: RepertoireSong; isExtra: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center sm:gap-5 sm:px-8">
      <p className="text-[16px] font-bold sm:text-[20px]" style={{ color: 'var(--s-muted)' }}>
        {isExtra ? (
          'Música de reserva'
        ) : (
          <>
            {cur?.block ? `Bloco ${(cur.blockIndex ?? 0) + 1} · ${cur.block.name}` : ''}
            <span className="mx-2" aria-hidden>·</span>
            <span className="tabular-nums" style={{ color: 'var(--s-text)' }}>{cur!.position} de {total}</span>
          </>
        )}
      </p>
      <h1 className="max-w-[20ch] break-words font-extrabold tracking-[-0.02em]" style={{ fontSize: 'clamp(42px, 8vw, 96px)', lineHeight: 1 }}>{song.title}</h1>
      {song.artist && <p className="font-semibold" style={{ fontSize: 'clamp(22px, 3.4vw, 40px)', color: 'var(--s-muted)', lineHeight: 1.1 }}>{song.artist}</p>}
      <div className="mt-1 flex flex-col items-center">
        <span className="text-[14px] font-bold uppercase tracking-[0.12em] sm:text-[16px]" style={{ color: 'var(--s-muted)' }}>Tom</span>
        <KeyValue value={song.currentKey} size="clamp(100px, 18vw, 180px)" />
      </div>
      <p className="max-w-full truncate text-[17px] sm:text-[22px]" style={{ color: 'var(--s-muted)' }}>
        {next ? (
          <>
            Próxima: <span className="font-bold" style={{ color: 'var(--s-text)' }}>{next.title}</span>
            {next.currentKey ? <> · <span style={{ color: 'var(--s-key)' }}>{next.currentKey}</span></> : ''}
          </>
        ) : (
          'Última música do show'
        )}
      </p>
    </div>
  );
}

/* ---- LISTA: a atual com contraste máximo e as próximas ---- */
function StageList({ seq, index, extra, onJump }: { seq: SongPlace[]; index: number; extra: RepertoireSong | null; onJump: (i: number) => void }) {
  const curRef = useRef<HTMLLIElement | null>(null);
  useEffect(() => {
    curRef.current?.scrollIntoView({ block: 'center' });
  }, [index]);
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2 sm:px-6">
      {extra && (
        <p className="mx-auto mb-2 max-w-4xl rounded-[14px] px-4 py-3 text-[18px] font-bold" style={{ background: 'var(--s-surface-2)' }}>
          Reserva agora: {extra.title}{extra.currentKey ? ` · ${extra.currentKey}` : ''}
        </p>
      )}
      <ol className="mx-auto flex max-w-4xl flex-col gap-1.5">
        {seq.map((p, i) => {
          const now = i === index;
          const past = i < index;
          return (
            <li key={p.song.id} ref={now ? curRef : undefined}>
              <button
                type="button"
                onClick={() => onJump(i)}
                aria-current={now ? 'true' : undefined}
                className="s-focus grid min-h-[68px] w-full grid-cols-[40px_minmax(0,1fr)_auto_56px] items-center gap-3 rounded-[14px] px-3 text-left sm:min-h-[80px] sm:grid-cols-[52px_minmax(0,1fr)_auto_72px] sm:px-5"
                style={now ? { background: 'var(--s-primary-strong)', color: '#fff' } : { background: 'var(--s-surface)', opacity: past ? 0.5 : 1 }}
              >
                <span className="text-right text-[18px] font-bold tabular-nums sm:text-[22px]" style={{ color: now ? '#fff' : 'var(--s-muted)' }}>{p.position}</span>
                <span className="min-w-0">
                  {now && <span className="block text-[11px] font-extrabold uppercase tracking-[0.1em]">Agora</span>}
                  <span className="block truncate text-[20px] font-extrabold sm:text-[26px]">{p.song.title}</span>
                  {p.song.artist && <span className="block truncate text-[14px] sm:text-[17px]" style={{ color: now ? 'rgba(255,255,255,0.85)' : 'var(--s-muted)' }}>{p.song.artist}</span>}
                </span>
                <span className="min-w-[44px] text-center text-[26px] font-extrabold sm:text-[34px]" style={{ color: now ? '#fff' : p.song.currentKey ? 'var(--s-key)' : 'var(--s-pending)' }}>
                  {p.song.currentKey || <span className="text-[14px]">sem tom</span>}
                </span>
                <span className="text-right text-[14px] tabular-nums sm:text-[17px]" style={{ color: now ? 'rgba(255,255,255,0.85)' : 'var(--s-muted)' }}>
                  {p.song.durationSec ? formatSongTime(p.song.durationSec) : ''}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ---- LETRA: topo fixo com nome e tom; só a letra que o cantor cadastrou ---- */
function StageLyrics({ song, lyricsRef, size, onScroll, onCycleSize, onLater }: {
  song: RepertoireSong;
  lyricsRef: React.MutableRefObject<HTMLDivElement | null>;
  size: number;
  onScroll: (dir: 1 | -1) => void;
  onCycleSize: () => void;
  onLater: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 sm:px-8">
      <div className="flex items-start justify-between gap-4 border-b pb-2 pt-1" style={{ borderColor: 'var(--s-border)' }}>
        <div className="min-w-0">
          <p className="truncate text-[22px] font-extrabold sm:text-[30px]">{song.title}</p>
          {song.artist && <p className="truncate text-[15px] sm:text-[18px]" style={{ color: 'var(--s-muted)' }}>{song.artist}</p>}
        </div>
        <p className="shrink-0 text-right">
          <span className="block text-[12px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--s-muted)' }}>Tom</span>
          <span className="text-[34px] font-extrabold sm:text-[44px]" style={{ color: song.currentKey ? 'var(--s-key)' : 'var(--s-pending)', lineHeight: 1 }}>{song.currentKey || '—'}</span>
        </p>
      </div>
      {song.lyrics ? (
        <>
          <div
            ref={lyricsRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-5"
            style={{ fontWeight: 500, fontSize: LYRICS_SIZES[size], lineHeight: 1.4, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
          >
            {song.lyrics}
            {/* folga no fim: a última linha pode subir até o meio da tela */}
            <div aria-hidden style={{ height: '40vh' }} />
          </div>
          <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.4fr)] gap-2 pb-1">
            <SmallStageButton onClick={() => onScroll(-1)} label="Subir a letra"><ChevronUp size={34} /></SmallStageButton>
            <SmallStageButton onClick={onCycleSize} label={`Tamanho da letra (${size + 1} de ${LYRICS_SIZES.length})`}><span className="text-[26px] font-extrabold">Aa</span></SmallStageButton>
            <SmallStageButton onClick={() => onScroll(1)} label="Descer a letra"><ChevronDown size={34} /></SmallStageButton>
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <p className="max-w-md text-[22px] font-bold sm:text-[26px]">Você ainda não adicionou uma letra para esta música.</p>
          <button type="button" onClick={onLater} className="s-focus s-press min-h-[56px] rounded-[14px] px-6 text-[17px] font-bold" style={{ border: '1.5px solid var(--s-border)', background: 'var(--s-surface)' }}>
            Adicionar depois
          </button>
        </div>
      )}
    </div>
  );
}

function SmallStageButton({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="s-focus s-press flex min-h-[64px] items-center justify-center rounded-[16px]" style={{ border: '1.5px solid var(--s-border)', background: 'var(--s-surface)' }}>
      {children}
    </button>
  );
}

function ReserveSheet({ reserve, onClose, onPick }: { reserve: RepertoireSong[]; onClose: () => void; onPick: (s: RepertoireSong) => void }) {
  return (
    <div className="fixed inset-0 z-10 flex flex-col px-3 py-3 sm:px-6 sm:py-6" style={{ background: 'rgba(2,8,18,0.97)' }} role="dialog" aria-modal="true" aria-label="Músicas de reserva">
      <div className="flex items-center justify-between">
        <p className="text-[28px] font-extrabold">Reserva</p>
        <button type="button" onClick={onClose} aria-label="Fechar reserva" className="s-focus s-press flex h-14 w-14 items-center justify-center rounded-[14px]" style={{ border: '1.5px solid var(--s-border)' }}>
          <X size={28} />
        </button>
      </div>
      <ul className="mt-4 flex-1 space-y-2 overflow-y-auto">
        {reserve.map((s) => (
          <li key={s.id}>
            <button type="button" onClick={() => onPick(s)} className="s-focus s-press flex min-h-[72px] w-full items-center justify-between gap-4 rounded-[14px] px-5 text-left" style={{ background: 'var(--s-surface)', border: '1px solid var(--s-border)' }}>
              <span className="min-w-0">
                <span className="block truncate text-[22px] font-extrabold">{s.title}</span>
                {s.artist && <span className="block truncate text-[15px]" style={{ color: 'var(--s-muted)' }}>{s.artist}</span>}
              </span>
              <span className="text-[34px] font-extrabold" style={{ color: s.currentKey ? 'var(--s-key)' : 'var(--s-pending)' }}>{s.currentKey || <span className="text-[14px]">sem tom</span>}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Sair pede confirmação — um toque sem querer no meio do show não pode derrubar a tela. */
function ExitConfirm({ onStay, onExit }: { onStay: () => void; onExit: () => void }) {
  const stayRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => stayRef.current?.focus(), []);
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center px-4" style={{ background: 'rgba(2,8,18,0.92)' }} role="alertdialog" aria-modal="true" aria-labelledby="sair-titulo">
      <div className="w-full max-w-md rounded-[20px] p-6" style={{ background: 'var(--s-surface-2)', border: '1px solid var(--s-border)' }}>
        <p id="sair-titulo" className="text-[26px] font-extrabold">Sair do Modo Palco?</p>
        <p className="mt-2 text-[17px]" style={{ color: 'var(--s-muted)' }}>Seu ponto atual será mantido.</p>
        <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button ref={stayRef} type="button" onClick={onStay} className="s-focus s-press min-h-[60px] rounded-[14px] text-[18px] font-extrabold" style={{ background: 'var(--s-primary-fill)', color: '#fff' }}>
            Continuar no palco
          </button>
          <button type="button" onClick={onExit} className="s-focus s-press min-h-[60px] rounded-[14px] text-[18px] font-bold" style={{ border: '1.5px solid var(--s-border)' }}>
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
