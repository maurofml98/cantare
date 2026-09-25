import { useEffect, useId, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import type { VenuePlace } from '@/lib/types';
import { MIN_QUERY, OSM_ATTRIBUTION, placeLabel, searchPlaces } from '@/lib/repertoire/places';

const DEBOUNCE_MS = 350;

/**
 * Campo Local do projeto: texto livre sempre aceito, com sugestões do OpenStreetMap quando
 * existirem (decisão de 25/09/2026). Escolher uma sugestão guarda o local; digitar de novo
 * volta a ser texto livre.
 */
export function VenueInput({
  id,
  value,
  place,
  onChange,
}: {
  id: string;
  value: string;
  place?: VenuePlace;
  onChange: (text: string, place?: VenuePlace) => void;
}) {
  const listId = useId();
  const [results, setResults] = useState<VenuePlace[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const typed = useRef(false);

  // busca só depois de a pessoa digitar (abrir o formulário de edição não consulta nada)
  useEffect(() => {
    if (!typed.current || place || value.trim().length < MIN_QUERY) {
      setResults([]);
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(() => {
      searchPlaces(value, ctrl.signal)
        .then((r) => {
          setResults(r);
          setActive(-1);
        })
        // sem rede ou Photon fora do ar: o texto livre continua valendo
        .catch(() => setResults([]))
        .finally(() => !ctrl.signal.aborted && setLoading(false));
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [value, place]);

  const choose = (p: VenuePlace) => {
    onChange(placeLabel(p), p);
    setOpen(false);
    setResults([]);
  };

  const showList = open && results.length > 0;

  return (
    <div className="relative">
      <Input
        id={id}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        value={value}
        onChange={(e) => {
          typed.current = true;
          onChange(e.target.value, undefined);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (!showList) return;
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(-1, a - 1)); }
          if (e.key === 'Enter' && active >= 0) { e.preventDefault(); choose(results[active]); }
          if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
        }}
        placeholder="Ex.: Bar do Zé, Goiânia"
        className="border-foreground/10 bg-background"
      />

      {showList && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-[8px] border border-foreground/10 bg-popover shadow-2xl">
          <ul id={listId} role="listbox" aria-label="Locais sugeridos" className="max-h-64 overflow-y-auto py-1">
            {results.map((p, i) => (
              <li
                key={`${p.osmType}${p.osmId}`}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                // mousedown: escolhe antes do blur fechar a lista
                onMouseDown={(e) => { e.preventDefault(); choose(p); }}
                className={`cursor-pointer px-3 py-2 ${i === active ? 'bg-accent' : 'hover:bg-foreground/[0.04]'}`}
              >
                <span className="block truncate text-[14px] text-foreground">{p.name}</span>
                <span className="block truncate text-[12px] text-muted-foreground">
                  {[p.address, p.district, [p.city, p.state].filter(Boolean).join(' - ')].filter(Boolean).join(' · ')}
                </span>
              </li>
            ))}
          </ul>
          <p className="border-t border-foreground/5 px-3 py-1.5 text-[11px] text-muted-foreground">{OSM_ATTRIBUTION}</p>
        </div>
      )}

      <p className="mt-1 min-h-[16px] text-[12px] text-muted-foreground" aria-live="polite">
        {place ? 'Local do mapa salvo.' : loading ? 'Procurando…' : ''}
      </p>
    </div>
  );
}
