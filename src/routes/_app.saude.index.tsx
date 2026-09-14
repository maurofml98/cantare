import { createFileRoute, Link } from '@tanstack/react-router';
import { VocalBody } from '@/components/illustrations';

export const Route = createFileRoute('/_app/saude/')({
  component: SaudePage,
});

const WARMUPS = [
  { id: 'geral', title: 'Aquecimento Geral', desc: 'Preparar as cordas vocais antes de cantar' },
  { id: 'agudos', title: 'Dificuldade nos Agudos', desc: 'Leveza e suporte para notas altas' },
  { id: 'graves', title: 'Dificuldade nos Graves', desc: 'Relaxamento laríngeo e ressonância' },
  { id: 'gravacao', title: 'Dia de Gravação', desc: 'Clareza e precisão máxima' },
  { id: 'diccao', title: 'Melhorar Dicção', desc: 'Agilidade articulatória' },
  { id: 'desaquecimento', title: 'Pós-Show', desc: 'Desaquecimento e recuperação vocal' },
];

function SaudePage() {
  return (
    <div className="relative max-w-5xl mx-auto animate-in">
      {/* Background illustration */}
      <VocalBody
        size={500}
        className="hidden md:block absolute -right-20 top-10 pointer-events-none"
        style={{ opacity: 0.04 }}
      />

      <header className="relative z-10 max-w-2xl mb-16">
        <h1
          className="text-white leading-none"
          style={{ fontFamily: 'Newsreader, serif', fontWeight: 300, fontSize: 'clamp(36px, 6vw, 52px)' }}
        >
          Cuide da sua voz
        </h1>
        <p
          className="mt-4"
          style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, fontSize: 14, color: 'rgba(255,255,255,0.4)' }}
        >
          Selecione o que sua voz precisa agora.
        </p>

        <Link
          to="/saude/tom"
          className="mt-8 inline-flex items-center gap-3 px-6 py-3 rounded-full"
          style={{
            fontFamily: 'DM Sans, sans-serif', fontWeight: 400, fontSize: 12, letterSpacing: '0.2em',
            border: '1px solid rgba(184,149,90,0.4)', color: '#B8955A',
            background: 'rgba(184,149,90,0.05)',
          }}
        >
          ⌘ TESTE DE TOM — AS TRÊS CORDAS →
        </Link>
      </header>

      {/* Editorial list */}
      <div className="relative z-10">
        {WARMUPS.map((w, i) => (
          <Link
            key={w.id}
            to="/saude/$warmupId"
            params={{ warmupId: w.id }}
            className="group flex items-center gap-6 py-6 px-2 hover:bg-white/[0.02] transition-colors border-t"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <span
              style={{
                fontFamily: 'Newsreader, serif',
                fontWeight: 300,
                fontSize: 18,
                color: 'rgba(201,168,76,0.4)',
                width: 40,
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="flex-1 min-w-0">
              <h2
                className="truncate transition-colors"
                style={{
                  fontFamily: 'Newsreader, serif',
                  fontWeight: 600,
                  fontSize: 22,
                  color: '#FFFFFF',
                }}
              >
                <span className="group-hover:text-[#B8955A] transition-colors">{w.title}</span>
              </h2>
              <p
                className="mt-1"
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: 300,
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                {w.desc}
              </p>
            </div>
            <span
              className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 18,
                color: '#B8955A',
              }}
            >
              →
            </span>
          </Link>
        ))}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-16 pt-8">
        <div style={{ height: 1, width: 60, backgroundColor: '#B8955A', opacity: 0.6 }} />
        <p
          className="mt-4 italic"
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 300,
            fontSize: 11,
            color: 'rgba(255,255,255,0.25)',
          }}
        >
          Estes exercícios são preventivos. Em caso de dor ou rouquidão, procure um fonoaudiólogo. — Laury
        </p>
      </div>
    </div>
  );
}
