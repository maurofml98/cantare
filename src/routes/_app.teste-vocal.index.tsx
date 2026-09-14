import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { clearVocalProfile, loadVocalProfile, type VocalProfile } from '@/lib/vocal/profile';
import { freqToMidi } from '@/lib/audio/pitch';
import { profileRanges } from '@/lib/home/today';
import { VoiceJourney, type JourneyNotes } from '@/components/vocal/VoiceJourney';
import { C, LINING, PrimaryButton, SANS, SERIF, SectionHeading } from '@/components/home/primitives';

export const Route = createFileRoute('/_app/teste-vocal/')({
  head: () => ({
    meta: [
      { title: 'Teste Vocal — Cantare' },
      { name: 'description', content: 'Descubra seu alcance vocal, região confortável e classificação aproximada em 3 minutos.' },
      { property: 'og:title', content: 'Teste Vocal — Cantare' },
      { property: 'og:description', content: 'Descubra sua voz. Um teste guiado em 3 minutos.' },
    ],
  }),
  component: TesteVocalIndex,
});

const PREPARO = [
  { title: 'Um lugar quieto', text: 'Ruído de fundo confunde a leitura. Um cômodo fechado já resolve.' },
  { title: 'Celular perto da boca', text: 'Mais ou menos um palmo, sem cobrir o microfone.' },
  { title: 'Sem forçar', text: 'Não é prova de força. Pare onde a nota ainda sai firme.' },
  { title: 'Dá para refazer', text: 'A voz muda de um dia para o outro. Refaça quando quiser.' },
];

function TesteVocalIndex() {
  const [profile, setProfile] = useState<VocalProfile | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

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
        comfort: profile.comfortHz
          ? freqToMidi(profile.comfortHz)
          : (ranges.comfortable.low + ranges.comfortable.high) / 2,
      }
    : null;
  const labels = profile
    ? { comfort: profile.comfortNote ?? profile.comfortableLow, low: profile.lowestNote, high: profile.highestNote }
    : undefined;

  return (
    <div className="mx-auto w-full max-w-6xl pb-8" style={LINING}>
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-16 lg:gap-y-12">
        {/* Apresentação e ação */}
        <div className="lg:col-span-6 lg:row-start-1">
          <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(44px, 10vw, 64px)', color: C.paper, lineHeight: 0.98 }}>
            Descubra sua voz
          </h1>

          {profile ? (
            <ProfileSummary profile={profile} />
          ) : (
            <p className="mt-5 max-w-lg" style={{ fontFamily: SANS, fontWeight: 300, fontSize: 17, color: C.paper2, lineHeight: 1.55 }}>
              Você canta três notas e o Cantare mede até onde sua voz vai, do grave ao agudo.
              Com isso, os treinos ficam dentro da sua faixa e cada música do repertório ganha
              uma sugestão de tom.
            </p>
          )}

          <p className="mt-5" style={{ fontFamily: SANS, fontSize: 14, color: C.paper3 }}>
            Cerca de 3 minutos · usa o microfone · o áudio não sai do seu aparelho
          </p>

          <div className="mt-7">
            <PrimaryButton to="/teste-vocal/executar">
              {profile ? 'Refazer teste' : 'Começar teste'}
            </PrimaryButton>
          </div>

          <p className="mt-5 max-w-md pl-4" style={{ borderLeft: `2px solid ${C.gold}`, fontFamily: SANS, fontSize: 13, color: C.paper2, lineHeight: 1.5 }}>
            O resultado é uma estimativa, não um veredito. Ele varia com o dia, o cansaço e o
            ambiente — por isso dá para refazer sempre.
          </p>

          {profile && (
            <div className="mt-6">
              {confirmDelete ? (
                <div className="pt-4" style={{ borderTop: `1px solid ${C.rule}` }}>
                  <p style={{ fontFamily: SANS, fontSize: 14, color: C.paper }}>
                    Apagar seu perfil vocal? Você pode medir de novo quando quiser.
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      onClick={handleDelete}
                      className="inline-flex h-11 items-center rounded-[6px] px-5"
                      style={{ border: '1px solid rgba(200,127,106,0.6)', color: '#C87F6A', fontFamily: SANS, fontSize: 14 }}
                    >
                      Apagar perfil
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="inline-flex h-11 items-center px-3"
                      style={{ color: C.paper2, fontFamily: SANS, fontSize: 14 }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex h-11 items-center underline underline-offset-4"
                  style={{ color: C.paper3, fontFamily: SANS, fontSize: 13 }}
                >
                  Apagar meu perfil vocal
                </button>
              )}
            </div>
          )}
        </div>

        {/* Jornada sobre a escada — no celular vem logo depois da ação */}
        <section
          className="lg:col-span-6 lg:col-start-7 lg:row-span-2 lg:row-start-1 lg:pt-4"
          aria-label={profile ? 'Suas três notas' : 'As três etapas do teste'}
        >
          <SectionHeading title={profile ? 'Suas três notas' : 'Três notas, nesta ordem'} />
          <div className="mt-6 lg:hidden">
            <VoiceJourney notes={notes} range={ranges?.range} highlight={ranges?.comfortable} labels={labels} height={400} />
          </div>
          <div className="mt-6 hidden lg:block">
            <VoiceJourney notes={notes} range={ranges?.range} highlight={ranges?.comfortable} labels={labels} height={520} />
          </div>
        </section>

        <div className="lg:col-span-6 lg:row-start-2">
          <section aria-labelledby="preparo">
            <SectionHeading title="Antes de começar" />
            <ul id="preparo" className="mt-4 grid grid-cols-1 sm:grid-cols-2 sm:gap-x-8">
              {PREPARO.map((p) => (
                <li key={p.title} className="py-3.5" style={{ borderTop: `1px solid ${C.rule}` }}>
                  <p style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 20, color: C.paper, lineHeight: 1.2 }}>{p.title}</p>
                  <p className="mt-1" style={{ fontFamily: SANS, fontSize: 13, color: C.paper3, lineHeight: 1.45 }}>{p.text}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4" style={{ fontFamily: SANS, fontSize: 12, color: C.paper3, lineHeight: 1.45 }}>
              Sentiu dor, rouquidão ou desconforto? Pare o teste e procure um profissional.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function ProfileSummary({ profile }: { profile: VocalProfile }) {
  const tested = new Date(profile.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
  const lowConfidence = profile.confidence && profile.confidence !== 'high';
  return (
    <div className="mt-5">
      <p style={{ fontFamily: SANS, fontWeight: 300, fontSize: 17, color: C.paper2, lineHeight: 1.55 }}>
        Seu último teste, em {tested}, estimou voz de{' '}
        <span style={{ color: C.paper }}>{profile.voiceType.toLowerCase()}</span>.
      </p>
      <dl className="mt-5 grid max-w-md grid-cols-2" style={{ borderTop: `1px solid ${C.rule}` }}>
        <div className="pt-3 pr-4">
          <dt style={{ fontFamily: SANS, fontSize: 13, color: C.paper3 }}>Extensão</dt>
          <dd style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 30, color: C.paper, lineHeight: 1.1 }}>
            {profile.lowestNote}–{profile.highestNote}
          </dd>
        </div>
        <div className="pt-3 pl-4" style={{ borderLeft: `1px solid ${C.rule}` }}>
          <dt style={{ fontFamily: SANS, fontSize: 13, color: C.paper3 }}>Região confortável</dt>
          <dd style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 30, color: C.gold, lineHeight: 1.1 }}>
            {profile.comfortableLow}–{profile.comfortableHigh}
          </dd>
        </div>
      </dl>
      {lowConfidence && (
        <p className="mt-3" style={{ fontFamily: SANS, fontSize: 13, color: '#C87F6A', lineHeight: 1.45 }}>
          A leitura teve interferência. Vale refazer num lugar mais quieto.
        </p>
      )}
    </div>
  );
}
