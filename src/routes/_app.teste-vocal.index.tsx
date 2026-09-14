import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { VocalProfileCard } from '@/components/vocal/VocalProfileCard';
import { clearVocalProfile, loadVocalProfile, type VocalProfile } from '@/lib/vocal/profile';

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

  return (
    <div className="mx-auto max-w-3xl px-6 py-8" style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}>
      <p
        className="text-[10px] uppercase text-[#B8955A]/80"
        style={{ letterSpacing: '0.32em' }}
      >
        Cantare · Teste Vocal
      </p>
      <h1
        className="mt-3 text-white"
        style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: 42, lineHeight: 1.05 }}
      >
        Descubra sua voz
      </h1>
      <p className="mt-4 max-w-xl text-[15px] text-[#8A8A95]" style={{ fontWeight: 300, lineHeight: 1.6 }}>
        Em três passos guiados, medimos seu alcance, sua região confortável e sua classificação vocal aproximada.
        Depois usamos isso para recomendar treinos e ajustar o tom das músicas do seu repertório.
      </p>

      <div className="mt-8">
        <VocalProfileCard profile={profile} />
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <StepCard n="I" title="Nota confortável" text="Cante um AAAAH sustentado, sem esforço." />
        <StepCard n="II" title="Nota mais grave" text="Desça devagar até o limite sustentável." />
        <StepCard n="III" title="Nota mais aguda" text="Suba até onde a voz ainda soa firme." />
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Link
          to="/teste-vocal/executar"
          className="inline-flex h-14 items-center justify-center rounded-2xl px-8 text-[#07080A] hover:brightness-110 hover:-translate-y-[1px] active:scale-[0.985] transition"
          style={{
            background: 'linear-gradient(180deg, #E8C97E 0%, #C9A867 45%, #B8955A 100%)',
            boxShadow: '0 12px 40px -12px rgba(184,149,90,0.6)',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
          }}
        >
          {profile ? 'Refazer teste' : 'Começar teste'} →
        </Link>
        {profile && !confirmDelete && (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-[10px] uppercase text-[#8A8A95] hover:text-red-400 transition-colors"
            style={{ letterSpacing: '0.28em' }}
          >
            ✕ Apagar perfil
          </button>
        )}
        <p className="text-[11px] uppercase text-[#8A8A95]" style={{ letterSpacing: '0.24em' }}>
          ≈ 3 minutos · precisa de microfone
        </p>
      </div>

      {confirmDelete && (
        <div
          className="mt-6 rounded-2xl p-5"
          style={{
            background: 'linear-gradient(180deg, rgba(30,10,10,0.6) 0%, rgba(15,10,10,0.5) 100%)',
            border: '1px solid rgba(220,80,80,0.25)',
          }}
        >
          <p className="text-white" style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: 20 }}>
            Apagar perfil vocal?
          </p>
          <p className="mt-1 text-[13px] text-[#8A8A95]" style={{ fontWeight: 300 }}>
            Você poderá fazer o teste novamente quando quiser.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <button
              onClick={handleDelete}
              className="inline-flex h-11 items-center justify-center rounded-xl px-5 text-white hover:brightness-110 active:scale-[0.985] transition"
              style={{
                background: 'linear-gradient(180deg, #b04040 0%, #7d2828 100%)',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
              }}
            >
              Apagar
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-[10px] uppercase text-[#8A8A95] hover:text-white transition-colors"
              style={{ letterSpacing: '0.28em' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepCard({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'linear-gradient(180deg, rgba(15,15,18,0.78) 0%, rgba(11,11,14,0.72) 100%)',
        border: '1px solid rgba(184,149,90,0.14)',
      }}
    >
      <p
        className="text-[10px] uppercase text-[#B8955A]/80"
        style={{ letterSpacing: '0.32em' }}
      >
        Ato {n}
      </p>
      <h3
        className="mt-2 text-white"
        style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: 20, lineHeight: 1.2 }}
      >
        {title}
      </h3>
      <p className="mt-2 text-[13px] text-[#8A8A95]" style={{ fontWeight: 300, lineHeight: 1.55 }}>
        {text}
      </p>
    </div>
  );
}
