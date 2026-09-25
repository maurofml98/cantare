import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, ListPlus, Pause, Play, Search } from 'lucide-react';
import { filterLibrary, formatDuration, libraryStyles, loadLibrary, type CreatedSong, type LibrarySort } from '@/lib/criar/library';
import { AddToRepertoireDialog } from './AddToRepertoireDialog';

type State = { status: 'loading' } | { status: 'error' } | { status: 'loaded'; list: CreatedSong[] };

/**
 * Biblioteca das criações do próprio cantor. Sem charts, artistas ou recomendações — não é
 * streaming. Hoje vazia de verdade: a geração ainda não existe.
 */
export function CreationLibrary() {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [query, setQuery] = useState('');
  const [style, setStyle] = useState('');
  const [sort, setSort] = useState<LibrarySort>('recentes');
  const [adding, setAdding] = useState<CreatedSong | null>(null);

  useEffect(() => {
    try {
      setState({ status: 'loaded', list: loadLibrary() });
    } catch {
      setState({ status: 'error' });
    }
  }, []);

  const list = useMemo(() => (state.status === 'loaded' ? state.list : []), [state]);
  const shown = useMemo(() => filterLibrary(list, { query, style, sort }), [list, query, style, sort]);
  const styles = useMemo(() => libraryStyles(list), [list]);

  return (
    <section aria-labelledby="biblioteca-titulo" className="flex flex-col gap-4">
      <header>
        <h2 id="biblioteca-titulo" className="text-[26px] font-extrabold tracking-[-0.02em] sm:text-[30px]" style={{ color: 'var(--c-text)' }}>
          Biblioteca
        </h2>
        <p className="mt-1 text-[15px]" style={{ color: 'var(--c-text-2)' }}>Suas músicas criadas ficam salvas aqui para ouvir, baixar ou levar ao repertório.</p>
      </header>

      {state.status === 'loaded' && list.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-[minmax(0,1fr)_auto]">
            <label className="relative block">
              <span className="sr-only">Buscar na biblioteca</span>
              <Search size={18} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--c-text-2)' }} />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar título ou estilo"
                className="c-focus min-h-[48px] w-full rounded-[14px] border bg-[var(--c-field)] pl-10 pr-3 text-[15px] outline-none"
                style={{ borderColor: 'var(--c-border)', color: 'var(--c-text)' }}
              />
            </label>
            <NativeSelect label="Filtrar por estilo" value={style} onChange={setStyle} options={[{ value: '', label: 'Todos os estilos' }, ...styles.map((s) => ({ value: s, label: s }))]} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[14px] font-medium" style={{ color: 'var(--c-text-2)' }} aria-live="polite">
              {shown.length} {shown.length === 1 ? 'música' : 'músicas'}
            </p>
            <NativeSelect
              label="Ordenar"
              value={sort}
              onChange={(v) => setSort(v as LibrarySort)}
              options={[{ value: 'recentes', label: 'Mais recentes' }, { value: 'antigas', label: 'Mais antigas' }, { value: 'titulo', label: 'Título (A–Z)' }]}
              compact
            />
          </div>
        </div>
      )}

      {state.status === 'loading' && (
        <div role="status" aria-label="Carregando a biblioteca" className="flex flex-col gap-3">
          {[0, 1].map((i) => <div key={i} className="h-[112px] rounded-[18px]" style={{ background: 'var(--c-surface-blue)' }} />)}
        </div>
      )}
      {state.status === 'error' && (
        <Notice title="Não conseguimos abrir sua biblioteca" text="Os dados ficam neste aparelho e parecem estar danificados." />
      )}
      {state.status === 'loaded' && list.length === 0 && <EmptyLibrary />}
      {state.status === 'loaded' && list.length > 0 && shown.length === 0 && (
        <Notice title="Nada encontrado" text="Tente outro título ou estilo." />
      )}
      {shown.length > 0 && (
        <ul className="flex flex-col gap-3">
          {shown.map((c) => <LibraryItem key={c.id} song={c} onAdd={() => setAdding(c)} />)}
        </ul>
      )}

      <AddToRepertoireDialog song={adding} onOpenChange={(o) => !o && setAdding(null)} />
    </section>
  );
}

function NativeSelect({ label, value, onChange, options, compact = false }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; compact?: boolean }) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`c-focus rounded-[14px] border bg-[var(--c-field)] px-3 font-semibold outline-none ${compact ? 'min-h-[44px] text-[14px]' : 'min-h-[48px] w-full text-[15px]'}`}
        style={{ borderColor: 'var(--c-border)', color: 'var(--c-text)' }}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

function Notice({ title, text }: { title: string; text: string }) {
  return (
    <div role="status" className="rounded-[18px] border px-5 py-6 text-center" style={{ borderColor: 'var(--c-border)', background: 'var(--c-inner)' }}>
      <p className="text-[16px] font-bold" style={{ color: 'var(--c-text)' }}>{title}</p>
      <p className="mt-1 text-[14px]" style={{ color: 'var(--c-text-2)' }}>{text}</p>
    </div>
  );
}

function EmptyLibrary() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[20px] border-2 border-dashed px-6 py-10 text-center" style={{ borderColor: 'var(--c-create-line)', background: 'var(--c-inner)' }}>
      <Cover style="" size={72} />
      <p className="text-[18px] font-extrabold" style={{ color: 'var(--c-text)' }}>Sua biblioteca começa aqui.</p>
      <p className="max-w-[320px] text-[15px]" style={{ color: 'var(--c-text-2)' }}>Quando você criar sua primeira guia, ela ficará salva neste espaço.</p>
    </div>
  );
}

/** Capa: a gerada, se houver; senão um desenho de onda na cor do estilo — nunca foto de artista. */
const STYLE_COLORS: Record<string, string> = { Gospel: '#176BFF', Sertanejo: '#FF8A34', Pagode: '#17B978', Forró: '#F0154F', MPB: '#8557E8' };

function Cover({ style, url, size = 88 }: { style: string; url?: string; size?: number }) {
  if (url) return <img src={url} alt="" width={size} height={size} loading="lazy" className="shrink-0 rounded-[14px] object-cover" style={{ width: size, height: size }} />;
  const color = STYLE_COLORS[style] ?? 'var(--c-create)';
  const bars = [10, 22, 34, 26, 40, 20, 30, 14];
  return (
    <svg width={size} height={size} viewBox="0 0 88 88" aria-hidden className="shrink-0 rounded-[14px]" style={{ background: 'var(--c-create-bg)' }}>
      <rect width="88" height="88" rx="14" fill={color} opacity="0.12" />
      {bars.map((h, i) => <rect key={i} x={12 + i * 8.5} y={44 - h / 2} width="4.5" height={h} rx="2.25" fill={color} />)}
    </svg>
  );
}

function LibraryItem({ song, onAdd }: { song: CreatedSong; onAdd: () => void }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const toggle = () => {
    if (!song.audioUrl) return;
    audio.current ??= Object.assign(new Audio(song.audioUrl), { onended: () => setPlaying(false) });
    if (playing) audio.current.pause();
    else audio.current.play().catch(() => setPlaying(false));
    setPlaying(!playing);
  };
  useEffect(() => () => audio.current?.pause(), []);
  const dur = formatDuration(song.durationSec);

  return (
    <li className="c-lift flex flex-col gap-3 rounded-[18px] border bg-[var(--c-inner)] p-3" style={{ borderColor: 'var(--c-border)' }}>
      <div className="flex items-center gap-3">
        <Cover style={song.style} url={song.coverUrl} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-bold" style={{ color: 'var(--c-text)' }}>{song.title}</p>
          <p className="mt-1 flex items-center gap-2 text-[13px]" style={{ color: 'var(--c-text-2)' }}>
            <span className="rounded-full px-2 py-0.5 font-semibold" style={{ background: 'var(--c-surface-blue)', color: 'var(--c-text)' }}>{song.style}</span>
            {dur && <span className="tabular-nums">{dur}</span>}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Action onClick={toggle} disabled={!song.audioUrl} label={playing ? 'Pausar' : 'Ouvir'} icon={playing ? <Pause size={16} /> : <Play size={16} />} />
        {song.audioUrl ? (
          <a href={song.audioUrl} download={`${song.title}.mp3`} className={ACTION} style={ACTION_STYLE}>
            <Download size={16} aria-hidden /> Baixar
          </a>
        ) : (
          <Action disabled label="Baixar" icon={<Download size={16} />} />
        )}
        <Action onClick={onAdd} label="Repertório" ariaLabel={`Adicionar ${song.title} ao repertório`} icon={<ListPlus size={16} />} />
      </div>
    </li>
  );
}

const ACTION = 'c-press c-focus inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-[12px] border px-2 text-[14px] font-semibold disabled:cursor-not-allowed disabled:opacity-45';
const ACTION_STYLE = { borderColor: 'var(--c-border)', color: 'var(--c-text)', background: 'var(--c-inner)' };

function Action({ onClick, disabled, label, ariaLabel, icon }: { onClick?: () => void; disabled?: boolean; label: string; ariaLabel?: string; icon: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={ariaLabel} className={ACTION} style={ACTION_STYLE}>
      <span aria-hidden>{icon}</span> {label}
    </button>
  );
}
