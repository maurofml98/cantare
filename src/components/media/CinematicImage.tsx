import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * Sistema de imagem do Cantare (assets em public/outros).
 *
 * Cada asset tem versões -960.webp e -1600.webp geradas a partir do original (~1MB):
 * celular e cards usam 960; heroes em desktop usam 1600. O original não é carregado.
 *
 * Tratamento padrão: gradiente direcional protegendo o texto + vinheta sutil.
 * Nunca "opacity baixa na foto inteira".
 */

export type AssetName =
  | 'cantare-afinacao' | 'cantare-aquecimento-vocal' | 'cantare-background-abstrato' | 'cantare-corpo-voz'
  | 'cantare-diario-treino-bg' | 'cantare-diccao-articulacao' | 'cantare-evolucao-corpo-extensao' | 'cantare-hidratacao'
  | 'cantare-home-palco' | 'cantare-home-repertorio' | 'cantare-home-treino-hoje' | 'cantare-modo-palco'
  | 'cantare-pos-show' | 'cantare-repertorio-preparacao' | 'cantare-respiracao-torax' | 'cantare-ressonancia-cabeca'
  | 'cantare-saude-vocal-bg' | 'cantare-teste-vocal' | 'cantare-voz-mista';

/** Dimensões dos originais — usadas para calcular pontos sobre a foto recortada. */
export const ASSET_SIZE: Record<AssetName, [number, number]> = {
  'cantare-afinacao': [1672, 941], 'cantare-aquecimento-vocal': [1672, 941], 'cantare-background-abstrato': [1672, 941],
  'cantare-corpo-voz': [1086, 1448], 'cantare-diario-treino-bg': [1672, 941], 'cantare-diccao-articulacao': [1448, 1086],
  'cantare-evolucao-corpo-extensao': [1672, 941], 'cantare-hidratacao': [1672, 941], 'cantare-home-palco': [1672, 941],
  'cantare-home-repertorio': [1672, 941], 'cantare-home-treino-hoje': [1672, 941], 'cantare-modo-palco': [1672, 941],
  'cantare-pos-show': [1672, 941], 'cantare-repertorio-preparacao': [1672, 941], 'cantare-respiracao-torax': [1672, 941],
  'cantare-ressonancia-cabeca': [1448, 1086], 'cantare-saude-vocal-bg': [1672, 941], 'cantare-teste-vocal': [1672, 941],
  'cantare-voz-mista': [1448, 1086],
};

export const assetSrc = (name: AssetName, w: 960 | 1600 = 960) => `/outros/${name}-${w}.webp`;
export const assetSrcSet = (name: AssetName) => `/outros/${name}-960.webp 960w, /outros/${name}-1600.webp 1600w`;

/** Link de preload para o `head` da rota — só a imagem crítica de cada tela. */
export const preloadAsset = (name: AssetName, sizes = '(max-width: 768px) 100vw, 60vw') => ({
  rel: 'preload',
  as: 'image',
  href: assetSrc(name, 1600),
  imageSrcSet: assetSrcSet(name),
  imageSizes: sizes,
  fetchPriority: 'high' as const,
  type: 'image/webp',
});

type Overlay = 'left' | 'right' | 'bottom' | 'top' | 'full' | 'none';

const OVERLAYS: Record<Exclude<Overlay, 'none'>, (k: number) => string> = {
  // k = intensidade (0..1): quanto a zona de texto escurece
  left: (k) => `linear-gradient(90deg, rgba(7,8,10,${0.96 * k}) 0%, rgba(7,8,10,${0.8 * k}) 36%, rgba(7,8,10,${0.28 * k}) 68%, rgba(7,8,10,${0.06 * k}) 100%)`,
  right: (k) => `linear-gradient(270deg, rgba(7,8,10,${0.96 * k}) 0%, rgba(7,8,10,${0.8 * k}) 38%, rgba(7,8,10,${0.26 * k}) 70%, rgba(7,8,10,${0.05 * k}) 100%)`,
  bottom: (k) => `linear-gradient(0deg, rgba(7,8,10,${0.97 * k}) 0%, rgba(7,8,10,${0.72 * k}) 38%, rgba(7,8,10,${0.12 * k}) 78%, rgba(7,8,10,0) 100%)`,
  top: (k) => `linear-gradient(180deg, rgba(7,8,10,${0.94 * k}) 0%, rgba(7,8,10,${0.5 * k}) 45%, rgba(7,8,10,0) 100%)`,
  full: (k) => `linear-gradient(180deg, rgba(7,8,10,${0.55 * k}), rgba(7,8,10,${0.75 * k}))`,
};

export interface CinematicImageProps {
  name: AssetName;
  /** Descreva só quando a imagem transmite conteúdo; decorativa = "". */
  alt?: string;
  /** object-position por breakpoint: base (celular) e md+ (desktop). */
  position?: string;
  positionMd?: string;
  overlay?: Overlay;
  intensity?: number;
  vignette?: boolean;
  /** Movimento lentíssimo — só heroes grandes. */
  kenBurns?: boolean;
  /** Primeira dobra: carrega já, com prioridade. */
  priority?: boolean;
  sizes?: string;
  className?: string;
  imgClassName?: string;
  /** Card clicável: a foto responde ao hover do `group` pai. */
  interactive?: boolean;
  /** Dissolve a borda da foto no painel (máscara), para imagens que não ocupam o card inteiro. */
  fade?: 'left' | 'bottom' | 'right';
}

const FADES = {
  left: 'linear-gradient(90deg, transparent 0%, #000 55%)',
  right: 'linear-gradient(270deg, transparent 0%, #000 55%)',
  bottom: 'linear-gradient(0deg, transparent 0%, #000 60%)',
} as const;

export function CinematicImage({
  name,
  alt = '',
  position = 'center',
  positionMd,
  overlay = 'left',
  intensity = 1,
  vignette = true,
  kenBurns = false,
  priority = false,
  sizes = '(max-width: 768px) 100vw, 50vw',
  className = '',
  imgClassName = '',
  interactive = false,
  fade,
}: CinematicImageProps) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden={alt ? undefined : true}
      style={fade ? { maskImage: FADES[fade], WebkitMaskImage: FADES[fade] } : undefined}
    >
      <img
        src={assetSrc(name, 960)}
        srcSet={assetSrcSet(name)}
        sizes={sizes}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : undefined}
        onLoad={() => setLoaded(true)}
        className={[
          'cine-img h-full w-full object-cover',
          kenBurns ? 'cine-kenburns' : '',
          interactive ? 'cine-interactive' : '',
          loaded ? 'opacity-100' : 'opacity-0',
          imgClassName,
        ].join(' ')}
        style={{ ['--pos' as string]: position, ['--pos-md' as string]: positionMd ?? position }}
      />
      {overlay !== 'none' && (
        <div className={`absolute inset-0 ${interactive ? 'cine-overlay' : ''}`} style={{ background: OVERLAYS[overlay](intensity) }} />
      )}
      {vignette && <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 90% at 50% 45%, transparent 55%, rgba(7,8,10,0.55) 100%)' }} />}
    </div>
  );
}

/**
 * Troca de imagem com crossfade calmo (antiga sai com leve zoom, nova entra assentando).
 * Mantém só duas camadas no DOM.
 */
export function CrossfadeImage(props: CinematicImageProps) {
  const [layers, setLayers] = useState<{ key: number; props: CinematicImageProps }[]>([{ key: 0, props }]);
  const counter = useRef(0);

  useEffect(() => {
    setLayers((cur) => {
      const top = cur[cur.length - 1];
      if (top.props.name === props.name && top.props.position === props.position) {
        return [{ ...top, props }];
      }
      counter.current += 1;
      return [top, { key: counter.current, props }];
    });
    const t = window.setTimeout(() => setLayers((cur) => cur.slice(-1)), 600);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.name, props.position, props.positionMd, props.overlay, props.intensity]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${props.className ?? ''}`} aria-hidden>
      {layers.map((l, i) => (
        <div key={l.key} className={`absolute inset-0 ${layers.length > 1 ? (i === 0 ? 'cine-out' : 'cine-in') : ''}`}>
          <CinematicImage {...l.props} className="" priority={l.props.priority} />
        </div>
      ))}
    </div>
  );
}

/**
 * Converte um ponto da foto original (px) para % do container recortado com object-fit: cover.
 * Serve para halos/pontos de UI ancorados no corpo retratado.
 */
export function useCoverPoints(
  name: AssetName,
  points: Record<string, [number, number]>,
  objectPosition: [number, number] = [50, 50],
) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Record<string, { x: number; y: number; visible: boolean }>>({});
  const [iw, ih] = ASSET_SIZE[name];

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const calc = () => {
      const W = el.clientWidth;
      const H = el.clientHeight;
      if (!W || !H) return;
      const s = Math.max(W / iw, H / ih);
      const dw = iw * s;
      const dh = ih * s;
      const ox = (dw - W) * (objectPosition[0] / 100);
      const oy = (dh - H) * (objectPosition[1] / 100);
      const next: Record<string, { x: number; y: number; visible: boolean }> = {};
      for (const [k, [px, py]] of Object.entries(points)) {
        const x = px * s - ox;
        const y = py * s - oy;
        next[k] = { x: (x / W) * 100, y: (y / H) * 100, visible: x >= 0 && x <= W && y >= 0 && y <= H };
      }
      setPos(next);
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, iw, ih, objectPosition[0], objectPosition[1]]);

  return { ref, pos };
}

/** Luz sutil seguindo o mouse (só desktop, só em 1–2 cards especiais). */
export function useSpotlight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(pointer: coarse), (prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    };
    el.addEventListener('pointermove', onMove);
    return () => {
      el.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);
  return ref;
}
