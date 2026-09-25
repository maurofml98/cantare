/**
 * Sugestão de local do show pelo Photon (busca sobre o OpenStreetMap). Escolhido em 25/09/2026
 * no lugar do Google Places: custo zero, sem chave, e os dados do OSM podem ser guardados com
 * atribuição (licença ODbL) — o Google não permite guardar nome e endereço, que é justamente o
 * valor que a Laury viu (base de onde os cantores tocam).
 *
 * Texto livre é sempre aceito: a sugestão só ajuda. Cobertura testada em 25/09/2026 — acha
 * Bar Brahma e Opinião, não acha Villa Country, Espaço Unimed nem Vila Mix. Se decepcionar em
 * uso real, troca-se a fonte aqui; a tela continua a mesma.
 *
 * A consulta vai do navegador direto para photon.komoot.io (CORS liberado). Só o texto digitado
 * sai do aparelho.
 */
import type { VenuePlace } from '@/lib/types';

const ENDPOINT = 'https://photon.komoot.io/api/';
/** Brasil inteiro (oeste, sul, leste, norte) */
const BRAZIL_BBOX = '-74,-34,-34,6';
export const MIN_QUERY = 3;
const LIMIT = 6;

export const OSM_ATTRIBUTION = 'Sugestões: © colaboradores do OpenStreetMap';

const UF: Record<string, string> = {
  Acre: 'AC', Alagoas: 'AL', Amapá: 'AP', Amazonas: 'AM', Bahia: 'BA', Ceará: 'CE', 'Distrito Federal': 'DF',
  'Espírito Santo': 'ES', Goiás: 'GO', Maranhão: 'MA', 'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS',
  'Minas Gerais': 'MG', Pará: 'PA', Paraíba: 'PB', Paraná: 'PR', Pernambuco: 'PE', Piauí: 'PI',
  'Rio de Janeiro': 'RJ', 'Rio Grande do Norte': 'RN', 'Rio Grande do Sul': 'RS', Rondônia: 'RO',
  Roraima: 'RR', 'Santa Catarina': 'SC', 'São Paulo': 'SP', Sergipe: 'SE', Tocantins: 'TO',
};

interface PhotonFeature {
  properties: {
    osm_type?: string;
    osm_id?: number;
    osm_value?: string;
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    city?: string;
    county?: string;
    state?: string;
    countrycode?: string;
  };
  geometry?: { coordinates?: [number, number] };
}

/** Resposta do Photon → locais com nome, no Brasil, sem repetir o mesmo objeto do OSM. */
export function parsePhoton(json: unknown): VenuePlace[] {
  const features = (json as { features?: PhotonFeature[] })?.features;
  if (!Array.isArray(features)) return [];
  const seen = new Set<string>();
  const out: VenuePlace[] = [];
  for (const f of features) {
    const p = f.properties ?? {};
    const c = f.geometry?.coordinates;
    if (!p.name || !p.osm_type || !p.osm_id || !c || p.countrycode !== 'BR') continue;
    const key = `${p.osm_type}${p.osm_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      source: 'osm',
      osmType: p.osm_type,
      osmId: p.osm_id,
      name: p.name,
      kind: p.osm_value,
      address: [p.street, p.housenumber].filter(Boolean).join(', ') || undefined,
      district: p.district,
      city: p.city ?? p.county,
      state: p.state ? (UF[p.state] ?? p.state) : undefined,
      lat: c[1],
      lon: c[0],
    });
  }
  return out;
}

/** "Bar Brahma, São Paulo - SP" — o texto que vai para o campo Local. */
export function placeLabel(p: Pick<VenuePlace, 'name' | 'city' | 'state'>): string {
  const where = [p.city, p.state].filter(Boolean).join(' - ');
  return where ? `${p.name}, ${where}` : p.name;
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<VenuePlace[]> {
  const q = query.trim();
  if (q.length < MIN_QUERY) return [];
  const url = `${ENDPOINT}?${new URLSearchParams({ q, bbox: BRAZIL_BBOX, limit: String(LIMIT) })}`;
  const res = await fetch(url, { signal });
  if (!res.ok) return [];
  return parsePhoton(await res.json());
}
