import { Link } from '@tanstack/react-router';
import type { VocalProfile } from '@/lib/vocal/profile';

export function RecommendationBanner({ profile }: { profile: VocalProfile | null }) {
  if (profile) {
    return (
      <div
        className="rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3"
        style={{
          background: 'linear-gradient(180deg, rgba(15,15,18,0.78) 0%, rgba(11,11,14,0.72) 100%)',
          border: '1px solid rgba(184,149,90,0.2)',
        }}
      >
        <div className="min-w-0">
          <p className="text-[10px] uppercase text-[#B8955A]/80" style={{ letterSpacing: '0.32em' }}>
            Seu perfil vocal
          </p>
          <p className="mt-1 text-white text-[14px]">
            {profile.voiceType} · alcance <b>{profile.lowestNote} → {profile.highestNote}</b>
            {' · '}confortável <b>{profile.comfortableLow} → {profile.comfortableHigh}</b>
          </p>
        </div>
        <Link
          to="/teste-vocal"
          className="text-[10px] uppercase text-[#B8955A] hover:text-[#E8C97E] transition-colors"
          style={{ letterSpacing: '0.28em' }}
        >
          Refazer teste →
        </Link>
      </div>
    );
  }
  return (
    <div
      className="rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3"
      style={{
        background: 'linear-gradient(180deg, rgba(30,25,15,0.6) 0%, rgba(15,12,8,0.5) 100%)',
        border: '1px solid rgba(184,149,90,0.25)',
      }}
    >
      <div className="min-w-0">
        <p className="text-[10px] uppercase text-[#B8955A]/80" style={{ letterSpacing: '0.32em' }}>
          Sem perfil vocal
        </p>
        <p className="mt-1 text-white text-[14px]">
          Faça o Teste Vocal para receber sugestões de tom em cada música.
        </p>
      </div>
      <Link
        to="/teste-vocal"
        className="inline-flex h-11 items-center justify-center rounded-xl px-5 text-[#07080A] hover:brightness-110 active:scale-[0.985] transition"
        style={{
          background: 'linear-gradient(180deg, #E8C97E 0%, #C9A867 45%, #B8955A 100%)',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
        }}
      >
        Fazer teste →
      </Link>
    </div>
  );
}
