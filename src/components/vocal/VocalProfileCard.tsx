import { Link } from '@tanstack/react-router';
import type { VocalProfile } from '@/lib/vocal/profile';

interface Props {
  profile: VocalProfile | null;
  compact?: boolean;
}

export function VocalProfileCard({ profile, compact }: Props) {
  if (!profile) {
    return (
      <div
        className="rounded-2xl p-6"
        style={{
          background: 'linear-gradient(180deg, rgba(15,15,18,0.78) 0%, rgba(11,11,14,0.72) 100%)',
          border: '1px solid rgba(184,149,90,0.18)',
        }}
      >
        <p
          className="text-[10px] uppercase text-[#B8955A]/80"
          style={{ letterSpacing: '0.32em' }}
        >
          Perfil vocal
        </p>
        <h3
          className="mt-2 text-white"
          style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: 22 }}
        >
          Descubra sua voz
        </h3>
        <p className="mt-2 text-[13px] text-[#8A8A95]" style={{ fontWeight: 300, lineHeight: 1.55 }}>
          Faça o teste vocal em 3 minutos: alcance, região confortável e classificação aproximada.
        </p>
        <Link
          to="/teste-vocal"
          className="mt-5 inline-flex h-11 items-center justify-center rounded-xl px-5 text-[#07080A] hover:brightness-110 transition"
          style={{
            background: 'linear-gradient(180deg, #E8C97E 0%, #C9A867 45%, #B8955A 100%)',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
          }}
        >
          Fazer teste vocal →
        </Link>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'linear-gradient(180deg, rgba(15,15,18,0.78) 0%, rgba(11,11,14,0.72) 100%)',
        border: '1px solid rgba(184,149,90,0.22)',
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className="text-[10px] uppercase text-[#B8955A]/80"
            style={{ letterSpacing: '0.32em' }}
          >
            Seu perfil vocal
          </p>
          <h3
            className="mt-2 text-white"
            style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: 26, lineHeight: 1.1 }}
          >
            {profile.voiceType}
          </h3>
        </div>
        <Link
          to="/teste-vocal"
          className="text-[10px] uppercase text-[#8A8A95] hover:text-white transition-colors"
          style={{ letterSpacing: '0.24em' }}
        >
          Refazer
        </Link>
      </div>

      <div className={`mt-5 grid ${compact ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'} gap-4`}>
        <Metric label="Alcance" value={`${profile.lowestNote} → ${profile.highestNote}`} />
        <Metric label="Extensão" value={`${profile.rangeSemitones} semitons`} />
        <Metric label="Confortável" value={`${profile.comfortableLow} → ${profile.comfortableHigh}`} />
        <Metric
          label="Testado em"
          value={new Date(profile.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
        />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        className="text-[9px] uppercase text-[#8A8A95]"
        style={{ letterSpacing: '0.28em', fontWeight: 400 }}
      >
        {label}
      </p>
      <p
        className="mt-1 text-white"
        style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: 17, lineHeight: 1.2 }}
      >
        {value}
      </p>
    </div>
  );
}
