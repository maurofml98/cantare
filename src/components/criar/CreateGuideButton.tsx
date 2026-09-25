import { useState } from 'react';
import { Info, Sparkles } from 'lucide-react';
import { SoonTag } from './fields';

/**
 * "Criar guia" — a geração não existe. O botão tem a cara final, mas intercepta o toque e diz
 * que chega em breve. Nada de carregamento falso nem chamada de API.
 */
export function CreateGuideButton() {
  const [told, setTold] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        aria-disabled="true"
        aria-describedby="criar-guia-aviso"
        onClick={() => setTold(true)}
        className="c-press c-focus flex min-h-[60px] w-full items-center justify-center gap-3 rounded-[16px] px-5 text-[20px] font-extrabold text-white"
        style={{ background: 'var(--c-create)', boxShadow: 'var(--c-create-shadow)' }}
      >
        <Sparkles size={22} aria-hidden /> Criar guia
        <span aria-hidden className="h-6 w-px bg-white/40" />
        <SoonTag tone="white" />
      </button>
      <p
        id="criar-guia-aviso"
        role="status"
        className="flex items-start gap-2.5 rounded-[14px] px-4 py-3 text-[14px] font-medium transition-colors duration-200"
        style={{ background: told ? 'var(--c-create-bg)' : 'var(--c-muted-bg)', color: told ? 'var(--c-create-ink)' : 'var(--c-text-2)' }}
      >
        <Info size={18} aria-hidden className="mt-0.5 shrink-0" />
        {told ? 'Ainda não dá para criar — este recurso chega em breve. Seu formulário fica aqui.' : 'Em breve você poderá criar suas músicas com o Cantare.'}
      </p>
    </div>
  );
}
