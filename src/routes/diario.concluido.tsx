import { createFileRoute, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/diario/concluido')({
  component: DayCompletePage,
});

function DayCompletePage() {
  const navigate = useNavigate();
  const totalXP = 7 * 15;

  return (
    <div
      className="fixed inset-0 bg-[#07080A] text-white z-50 flex flex-col items-center justify-center px-6"
      style={{ fontFamily: 'DM Sans, sans-serif' }}
    >
      <div className="max-w-md w-full text-center animate-in fade-in duration-700">
        <div className="w-24 h-24 rounded-full border border-[#B8955A]/40 flex items-center justify-center mx-auto mb-8">
          <span className="text-[#B8955A] text-4xl">✓</span>
        </div>
        <h1
          className="text-white mb-3"
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontWeight: 300,
            fontSize: 36,
            lineHeight: 1.1,
          }}
        >
          Dia 1 Concluído
        </h1>
        <p
          className="text-[14px] text-[#888899] mb-10"
          style={{ fontWeight: 300 }}
        >
          Você completou todos os 7 exercícios de hoje.
        </p>

        <div
          className="rounded-2xl p-6 mb-10"
          style={{ backgroundColor: '#0D0F12' }}
        >
          <p
            className="text-[11px] uppercase text-[#666677]"
            style={{ fontWeight: 300, letterSpacing: '0.15em' }}
          >
            XP total ganho
          </p>
          <p
            className="mt-2"
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontWeight: 600,
              fontSize: 48,
              color: '#B8955A',
              lineHeight: 1,
            }}
          >
            +{totalXP} XP
          </p>
        </div>

        <button
          onClick={() => navigate({ to: '/diario/evolucao' })}
          className="w-full h-14 rounded-2xl text-[#07080A] transition-all active:scale-[0.98]"
          style={{
            backgroundColor: '#B8955A',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: '0.12em',
          }}
        >
          VER MEU PROGRESSO →
        </button>
      </div>
    </div>
  );
}
