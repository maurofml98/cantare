import { expect, test } from 'bun:test';
import { parsePhoton, placeLabel } from './places';

// resposta real do Photon (25/09/2026), reduzida
const feature = (over: Record<string, unknown> = {}, coords: [number, number] = [-46.64, -23.54]) => ({
  type: 'Feature',
  properties: { osm_type: 'N', osm_id: 2098302406, osm_value: 'bar', name: 'Bar Brahma', street: 'Avenida São João', housenumber: '665', district: 'República', city: 'São Paulo', state: 'São Paulo', countrycode: 'BR', ...over },
  geometry: { type: 'Point', coordinates: coords },
});

test('converte o local, com UF e coordenadas', () => {
  expect(parsePhoton({ features: [feature()] })).toEqual([
    { source: 'osm', osmType: 'N', osmId: 2098302406, name: 'Bar Brahma', kind: 'bar', address: 'Avenida São João, 665', district: 'República', city: 'São Paulo', state: 'SP', lat: -23.54, lon: -46.64 },
  ]);
});

test('descarta sem nome, fora do Brasil e repetidos', () => {
  const r = parsePhoton({ features: [feature(), feature(), feature({ name: undefined, osm_id: 1 }), feature({ countrycode: 'PE', osm_id: 2 })] });
  expect(r).toHaveLength(1);
});

test('resposta inválida vira lista vazia', () => {
  expect(parsePhoton(null)).toEqual([]);
  expect(parsePhoton({})).toEqual([]);
});

test('sem cidade usa o município (county)', () => {
  expect(parsePhoton({ features: [feature({ city: undefined, county: 'Abadia de Goiás', state: 'Goiás' })] })[0]).toMatchObject({ city: 'Abadia de Goiás', state: 'GO' });
});

test('rótulo do campo Local', () => {
  expect(placeLabel({ name: 'Bar Brahma', city: 'São Paulo', state: 'SP' })).toBe('Bar Brahma, São Paulo - SP');
  expect(placeLabel({ name: 'Boteco' })).toBe('Boteco');
});
