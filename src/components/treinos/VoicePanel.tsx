import { NoteLadder } from '@/components/vocal/NoteLadder';
import { CinematicImage } from '@/components/media/CinematicImage';
import type { VocalProfile } from '@/lib/vocal/profile';
import { profileRanges } from '@/lib/home/today';
import { C, Panel, SANS, SecondaryButton, SERIF, TextLink } from '@/components/home/primitives';

/** Sua voz (escada) — vive em Treino: o teste vocal saiu da navegação (CLAUDE.md, seção 14). */

export function VoicePanel({ profile }: { profile: VocalProfile | null }) {
  const ranges = profile ? profileRanges(profile) : null;
  const tested = profile
    ? new Date(profile.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '')
    : null;

  return (
    <Panel
      title="Sua voz"
      subtitle={profile ? 'Extensão estimada no último teste' : 'Ainda não medimos sua extensão'}
      labelledBy="sua-voz"
      className="h-full"
    >
      {/* A voz no corpo: presença humana ao lado dos dados reais (os dados ficam em HTML). */}
      <CinematicImage
        name="cantare-corpo-voz"
        overlay="none"
        vignette={false}
        fade="left"
        position="50% 18%"
        className="!left-auto hidden w-[44%] sm:block"
        sizes="(max-width: 1536px) 30vw, 20vw"
      />
      <div className="relative grid min-h-[260px] flex-1 grid-cols-[88px_minmax(0,1fr)] gap-5 sm:grid-cols-[88px_minmax(0,1fr)_32%]">
        <div className="min-h-0 py-1">
          <NoteLadder
            range={ranges?.range}
            highlight={ranges?.comfortable}
            dimmed={!profile}
            min={40}
            max={84}
            ariaLabel={profile ? `Extensão estimada: ${profile.lowestNote} a ${profile.highestNote}` : 'Extensão ainda não medida'}
          />
        </div>

        {profile ? (
          <dl className="flex min-w-0 flex-col justify-center gap-3" style={{ fontFamily: SANS }}>
            <div>
              <dt style={{ fontSize: 12, color: C.paper3 }}>Tipo de voz</dt>
              <dd style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 30, color: C.paper, lineHeight: 1.05 }}>
                {profile.voiceType}
                <span className="block" style={{ fontFamily: SANS, fontSize: 12, color: C.paper3 }}>estimativa, pode variar</span>
              </dd>
            </div>
            <Fact label="Extensão" value={`${profile.lowestNote} – ${profile.highestNote}`} />
            <Fact label="Região confortável" value={`${profile.comfortableLow} – ${profile.comfortableHigh}`} gold />
            <Fact label="Testado em" value={tested ?? ''} />
            {profile.confidence && profile.confidence !== 'high' && (
              <p style={{ fontSize: 12, color: C.warn, lineHeight: 1.4 }}>Leitura com ruído. Vale refazer.</p>
            )}
            <div className="pt-1">
              <TextLink to="/teste-vocal">Refazer teste</TextLink>
            </div>
          </dl>
        ) : (
          <div className="flex min-w-0 flex-col justify-center gap-4">
            <p style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 24, color: C.paper, lineHeight: 1.2 }}>
              Descubra até onde sua voz vai.
            </p>
            <p style={{ fontFamily: SANS, fontSize: 13, color: C.paper2, lineHeight: 1.5 }}>
              Três notas, cerca de 3 minutos. Com isso, o treino fica dentro da sua faixa.
            </p>
            <div>
              <SecondaryButton to="/teste-vocal">Fazer teste vocal</SecondaryButton>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}

function Fact({ label, value, gold = false }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 pb-2" style={{ borderBottom: `1px solid ${C.rule}` }}>
      <dt style={{ fontSize: 13, color: C.paper3 }}>{label}</dt>
      <dd style={{ fontFamily: SERIF, fontSize: 19, color: gold ? C.gold : C.paper }}>{value}</dd>
    </div>
  );
}
