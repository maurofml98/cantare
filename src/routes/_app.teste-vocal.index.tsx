import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { clearVocalProfile, isLegacyProfile, loadVocalProfile, type VocalProfile } from '@/lib/vocal/profile';
import { freqToMidi } from '@/lib/audio/pitch';
import { profileRanges } from '@/lib/home/today';
import { LadderSteps, type JourneyNotes } from '@/components/vocal/VoiceJourney';
import { CinematicImage, preloadAsset } from '@/components/media/CinematicImage';
import { C, LINING, Panel, PrimaryButton, SANS, SERIF, focusRing } from '@/components/home/primitives';

const HERO_SIZES = '(max-width: 1024px) 100vw, 30vw';

export const Route = createFileRoute('/_app/teste-vocal/')({
  head: () => ({
    links: [preloadAsset('cantare-teste-vocal', HERO_SIZES)],
    meta: [
      { title: 'Teste Vocal — Cantare' },
      { name: 'description', content: 'Descubra seu alcance vocal, região confortável e classificação aproximada em 3 minutos.' },
      { property: 'og:title', content: 'Teste Vocal — Cantare' },
      { property: 'og:description', content: 'Descubra sua voz. Um teste guiado em 3 minutos.' },
    ],
  }),
  component: TesteVocalIndex,
});

type MicState = 'granted' | 'prompt' | 'denied' | 'unknown';

/** Só consulta a permissão — nunca pede o microfone nesta tela. */
function useMicPermission(): MicState {
  const [state, setState] = useState<MicState>('unknown');
  useEffect(() => {
    let status: PermissionStatus | null = null;
    const update = () => status && setState(status.state as MicState);
    navigator.permissions
      ?.query({ name: 'microphone' as PermissionName })
      .then((s) => {
        status = s;
        update();
        s.addEventListener('change', update);
      })
      .catch(() => setState('unknown'));
    return () => status?.removeEventListener('change', update);
  }, []);
  return state;
}

const STEPS = [
  { n: 1, title: 'Nota confortável', text: 'Cante um “aaah” sustentado numa nota confortável.', dir: 'mid' as const },
  { n: 2, title: 'Nota mais grave', text: 'Desça devagar até o limite grave da sua voz, sem forçar.', dir: 'down' as const },
  { n: 3, title: 'Nota mais aguda', text: 'Suba aos poucos até o limite agudo, mantendo o controle.', dir: 'up' as const },
];

const PREP = [
  { mark: 'quiet', title: 'Lugar silencioso', text: 'Ruído de fundo confunde a leitura.' },
  { mark: 'mic', title: 'Microfone do aparelho', text: 'Um palmo da boca, sem cobrir.' },
  { mark: 'wave', title: 'Cante natural', text: 'Do jeito que você canta no show.' },
  { mark: 'ease', title: 'Sem forçar', text: 'Pare onde a nota ainda sai firme.' },
  { mark: 'stop', title: 'Doeu? Pare', text: 'Dor ou rouquidão pedem um profissional.', warn: true },
  { mark: 'vary', title: 'Pode variar', text: 'Dia, cansaço e ambiente mudam a voz.' },
] as const;

function TesteVocalIndex() {
  const [profile, setProfile] = useState<VocalProfile | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const mic = useMicPermission();

  useEffect(() => {
    setProfile(loadVocalProfile());
  }, []);

  const handleDelete = () => {
    clearVocalProfile();
    setProfile(null);
    setConfirmDelete(false);
  };

  const ranges = profile ? profileRanges(profile) : null;
  const notes: JourneyNotes | null = profile && ranges
    ? {
        low: ranges.range.low,
        high: ranges.range.high,
        comfort: profile.comfortHz ? freqToMidi(profile.comfortHz) : (ranges.comfortable.low + ranges.comfortable.high) / 2,
      }
    : null;

  return (
    <div
      style={LINING}
      className="grid grid-cols-1 gap-5 lg:grid-cols-12 2xl:[@media(min-height:1000px)]:h-[calc(100dvh-3rem)] 2xl:[@media(min-height:1000px)]:grid-rows-[minmax(0,2.55fr)_minmax(0,1fr)]"
    >
      {/* ===== Introdução + card principal ===== */}
      <div className="flex min-h-0 flex-col gap-5 lg:col-span-12 xl:col-span-5">
        <header className="px-1">
          <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(44px, 4.2vw, 76px)', color: C.paper, lineHeight: 1 }}>
            Descubra sua <em style={{ color: C.gold }}>voz</em>
          </h1>
          <p className="mt-3 max-w-[640px]" style={{ fontFamily: SANS, fontWeight: 300, fontSize: 17, color: C.paper2, lineHeight: 1.5 }}>
            Em poucos minutos, medimos seu alcance vocal, sua região confortável e uma classificação aproximada
            para personalizar seus treinos e sugerir tons mais adequados para seu repertório.
          </p>
        </header>

        <Panel glow className="flex-1" bodyClassName="!p-0">
          <div className="flex h-full flex-col p-5 sm:p-6 2xl:p-7">
            <div className="flex items-baseline justify-between gap-3">
              <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 30, color: C.paper, lineHeight: 1 }}>Teste vocal</h2>
              <span style={{ fontFamily: SANS, fontSize: 13, color: profile ? C.gold : C.paper3 }}>
                {profile ? `Último teste em ${formatDate(profile.createdAt)}` : 'Você ainda não fez o teste'}
              </span>
            </div>

            {/* fatos */}
            <dl className="mt-4 grid grid-cols-1 sm:grid-cols-3" style={{ borderTop: `1px solid ${C.rule}`, borderBottom: `1px solid ${C.rule}` }}>
              <Fact label="Duração" value="~3" unit="minutos" />
              <Fact label="Microfone" value={micLabel(mic).value} unit={micLabel(mic).unit} warn={mic === 'denied'} divider />
              <Fact label="Ambiente" value="Silêncio" unit="recomendado" divider />
            </dl>

            {/* o que descobre / para que serve */}
            <div className="mt-4 grid min-h-0 flex-1 grid-cols-1 gap-5 max-sm:order-3 sm:grid-cols-2">
              <div>
                <p style={{ fontFamily: SANS, fontSize: 13, color: C.paper3 }}>O que você descobre</p>
                <ul className="mt-2 space-y-2">
                  <Discover title="Extensão vocal" value={profile ? `${profile.lowestNote} – ${profile.highestNote}` : undefined} hint="da nota mais grave à mais aguda" />
                  <Discover title="Região confortável" value={profile ? `${profile.comfortableLow} – ${profile.comfortableHigh}` : undefined} hint="onde a voz trabalha sem esforço" gold />
                  <Discover title="Classificação aproximada" value={profile ? profile.voiceType : undefined} hint="uma referência, não um rótulo" />
                </ul>
              </div>
              <div>
                <p style={{ fontFamily: SANS, fontSize: 13, color: C.paper3 }}>Para que serve</p>
                <ul className="mt-2 space-y-2.5" style={{ fontFamily: SANS, fontSize: 14, color: C.paper2, lineHeight: 1.45 }}>
                  <li className="flex gap-2.5"><Tick />Treinos montados dentro da sua faixa</li>
                  <li className="flex gap-2.5"><Tick />Sugestão de tom para cada música do repertório</li>
                  <li className="flex gap-2.5"><Tick />Acompanhar como sua voz muda com o tempo</li>
                </ul>
                {profile && isLegacyProfile(profile) ? (
                  <p className="mt-3" style={{ fontFamily: SANS, fontSize: 13, color: C.warn, lineHeight: 1.4 }}>
                    Seu teste foi feito numa versão anterior, que podia errar a nota mais grave e a mais aguda. Refaça para um resultado confiável.
                  </p>
                ) : profile?.confidence && profile.confidence !== 'high' && (
                  <p className="mt-3" style={{ fontFamily: SANS, fontSize: 13, color: C.warn, lineHeight: 1.4 }}>
                    Seu último teste teve interferência. Vale refazer num lugar mais quieto.
                  </p>
                )}
              </div>
            </div>

            <p className="mt-4 pl-3 max-sm:order-2" style={{ borderLeft: `2px solid ${C.gold}`, fontFamily: SANS, fontSize: 13, color: C.paper2, lineHeight: 1.45 }}>
              O resultado é uma estimativa e pode variar conforme sua voz, o ambiente e o microfone.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 max-sm:order-1">
              <PrimaryButton to="/teste-vocal/executar" className="sm:min-w-[220px]">
                {profile ? 'Refazer teste' : 'Começar teste'}
              </PrimaryButton>
              {profile &&
                (confirmDelete ? (
                  <span className="flex items-center gap-3" style={{ fontFamily: SANS, fontSize: 13 }}>
                    <span style={{ color: C.paper2 }}>Apagar seu perfil vocal?</span>
                    <button onClick={handleDelete} className={`rounded-sm underline underline-offset-4 ${focusRing}`} style={{ color: C.warn }}>Apagar</button>
                    <button onClick={() => setConfirmDelete(false)} className={`rounded-sm ${focusRing}`} style={{ color: C.paper3 }}>Cancelar</button>
                  </span>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className={`rounded-sm underline underline-offset-4 ${focusRing}`}
                    style={{ fontFamily: SANS, fontSize: 13, color: C.paper3 }}
                  >
                    Apagar meu perfil vocal
                  </button>
                ))}
            </div>
          </div>
        </Panel>
      </div>

      {/* ===== Cena: a voz percorrendo as notas ===== */}
      <Panel
        className="min-h-[420px] 2xl:min-h-0 max-lg:order-3 lg:col-span-7 xl:col-span-4"
        bodyClassName="justify-end"
        media={
          <CinematicImage
            name="cantare-teste-vocal"
            priority
            kenBurns
            overlay="bottom"
            intensity={1}
            position="34% 40%"
            sizes={HERO_SIZES}
          />
        }
      >
        <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 30, color: C.paper, lineHeight: 1.05 }}>
          Sua voz vive no <em style={{ color: C.gold }}>corpo</em>
        </h2>
        <p className="mt-2 max-w-[420px]" style={{ fontFamily: SANS, fontSize: 14, color: C.paper2, lineHeight: 1.5 }}>
          O teste percorre três regiões: a confortável, a mais grave e a mais aguda que sua voz alcança sem esforço.
        </p>
      </Panel>

      {/* ===== Escada ===== */}
      <Panel
        title="Escada de notas"
        subtitle={profile ? 'Suas notas no último teste' : 'Onde cada etapa acontece'}
        labelledBy="escada"
        className="max-lg:order-4 lg:col-span-5 xl:col-span-3"
      >
        <div className="h-[340px] min-h-0 flex-1 sm:h-[380px] 2xl:h-auto">
          <LadderSteps
            notes={notes}
            range={ranges?.range}
            highlight={ranges?.comfortable}
            labels={profile ? { comfort: profile.comfortNote ?? profile.comfortableLow, low: profile.lowestNote, high: profile.highestNote } : undefined}
          />
        </div>
        <p className="mt-3 pt-3" style={{ borderTop: `1px solid ${C.rule}`, fontFamily: SANS, fontSize: 12, color: C.paper3, lineHeight: 1.45 }}>
          Cada traço é um semitom. Grave embaixo, agudo em cima.{profile ? ' A faixa dourada é a sua.' : ' Exemplo ilustrativo.'}
        </p>
      </Panel>

      {/* ===== Etapas ===== */}
      <Panel
        title="Como funciona"
        subtitle="Três notas, nesta ordem. O app guia cada uma."
        labelledBy="etapas"
        className="max-lg:order-2 lg:col-span-7"
      >
        <ol className="relative grid flex-1 grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
          {/* trilha que liga as etapas */}
          <span aria-hidden className="absolute left-[18px] right-[18px] top-[18px] hidden h-px sm:block" style={{ background: `linear-gradient(90deg, ${C.gold}, rgba(184,149,90,0.25))` }} />
          <span aria-hidden className="absolute bottom-4 left-[18px] top-4 w-px sm:hidden" style={{ background: `linear-gradient(180deg, ${C.gold}, rgba(184,149,90,0.25))` }} />
          {STEPS.map((s) => (
            <li key={s.n} className="relative flex gap-4 sm:flex-col sm:gap-3">
              <span
                className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                style={{ background: C.surface, border: `1px solid ${C.gold}`, fontFamily: SERIF, fontSize: 18, color: C.gold }}
              >
                {s.n}
              </span>
              <div>
                <p className="flex items-center gap-2" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 23, color: C.paper, lineHeight: 1.15 }}>
                  {s.title}
                  <Direction dir={s.dir} />
                </p>
                <p className="mt-1.5" style={{ fontFamily: SANS, fontSize: 14, color: C.paper2, lineHeight: 1.5 }}>{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Panel>

      {/* ===== Preparo ===== */}
      <Panel title="Antes de começar" subtitle="Pequenos cuidados, resultado mais fiel." labelledBy="preparo" className="max-lg:order-5 lg:col-span-5">
        <ul className="grid flex-1 grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
          {PREP.map((p) => (
            <li key={p.title} className="flex gap-3">
              <PrepMark kind={p.mark} warn={'warn' in p && p.warn} />
              <div className="min-w-0">
                <p style={{ fontFamily: SERIF, fontSize: 17, color: 'warn' in p && p.warn ? '#D9A08C' : C.paper, lineHeight: 1.2 }}>{p.title}</p>
                <p className="mt-0.5" style={{ fontFamily: SANS, fontSize: 12, color: C.paper3, lineHeight: 1.4 }}>{p.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

/* ---------- peças ---------- */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '');
}

function micLabel(mic: MicState) {
  if (mic === 'granted') return { value: 'Liberado', unit: 'pronto para usar' };
  if (mic === 'denied') return { value: 'Bloqueado', unit: 'libere no navegador' };
  return { value: 'Necessário', unit: 'pedimos ao começar' };
}

function Fact({ label, value, unit, divider = false, warn = false }: { label: string; value: string; unit: string; divider?: boolean; warn?: boolean }) {
  return (
    <div
      className={`flex items-baseline justify-between gap-3 py-2.5 sm:block sm:py-3 ${divider ? 'max-sm:border-t sm:border-l sm:pl-4' : 'sm:pr-4'}`}
      style={{ borderColor: C.rule }}
    >
      <dt style={{ fontFamily: SANS, fontSize: 12, color: C.paper3 }}>{label}</dt>
      <dd className="text-right sm:text-left">
        <span className="truncate sm:block" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(22px, 1.7vw, 30px)', color: warn ? C.warn : C.paper, lineHeight: 1.1 }}>
          {value}
        </span>
        <span className="ml-2 truncate sm:ml-0 sm:block" style={{ fontFamily: SANS, fontSize: 12, color: C.paper3 }}>{unit}</span>
      </dd>
    </div>
  );
}

function Discover({ title, value, hint, gold = false }: { title: string; value?: string; hint: string; gold?: boolean }) {
  return (
    <li className="flex items-baseline justify-between gap-3 pb-2" style={{ borderBottom: `1px solid ${C.rule}` }}>
      <span className="min-w-0">
        <span className="block" style={{ fontFamily: SANS, fontSize: 14, color: C.paper }}>{title}</span>
        <span className="block truncate" style={{ fontFamily: SANS, fontSize: 12, color: C.paper3 }}>{hint}</span>
      </span>
      <span className="shrink-0" style={{ fontFamily: SERIF, fontSize: 20, color: value ? (gold ? C.gold : C.paper) : 'rgba(232,228,220,0.25)' }}>
        {value ?? '—'}
      </span>
    </li>
  );
}

function Tick() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" className="mt-[3px] shrink-0" aria-hidden>
      <path d="M2.5 7.5l3 3 6-7" fill="none" stroke={C.gold} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Direction({ dir }: { dir: 'mid' | 'down' | 'up' }) {
  const s = { stroke: C.gold, strokeWidth: 1.3, strokeLinecap: 'round' as const, fill: 'none' };
  return (
    <svg width="16" height="18" viewBox="0 0 16 18" aria-hidden>
      {dir === 'mid' && <path d="M2 9h12" {...s} />}
      {dir === 'down' && <path d="M8 2v14m-4-4 4 4 4-4" {...s} />}
      {dir === 'up' && <path d="M8 16V2M4 6l4-4 4 4" {...s} />}
    </svg>
  );
}

/** Marcas desenhadas à mão para o preparo — não ícones de biblioteca. */
function PrepMark({ kind, warn }: { kind: (typeof PREP)[number]['mark']; warn?: boolean }) {
  const color = warn ? C.warn : C.gold;
  const s = { stroke: color, strokeWidth: 1.3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" className="mt-0.5 shrink-0" aria-hidden>
      {kind === 'quiet' && <><path d="M4 13h3M9 9v8M13 11v4M17 12.5v1M21 13h1" {...s} /></>}
      {kind === 'mic' && <><rect x="9.5" y="3" width="7" height="12" rx="3.5" {...s} /><path d="M6 12a7 7 0 0 0 14 0M13 19v4" {...s} /></>}
      {kind === 'wave' && <path d="M3 13c3-6 5-6 7 0s4 6 7 0 4-6 6-2" {...s} />}
      {kind === 'ease' && <path d="M4 19c6 0 6-12 18-12" {...s} />}
      {kind === 'stop' && <><path d="M13 4 23 21H3z" {...s} /><path d="M13 10v5M13 18h.01" {...s} /></>}
      {kind === 'vary' && <><path d="M4 16c3 0 3-6 6-6s3 6 6 6 3-6 6-6" {...s} strokeOpacity={0.5} /><path d="M4 12c3 0 3-4 6-4s3 4 6 4 3-4 6-4" {...s} /></>}
    </svg>
  );
}
