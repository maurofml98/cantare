import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Toasts do Cantare: superfície escura, borda fina, faixa lateral por tipo
 * (sucesso dourado, erro terroso, aviso âmbar, info marfim). Máx. 3 visíveis.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="bottom-right"
      visibleToasts={3}
      duration={3600}
      offset={24}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "group flex w-[min(92vw,380px)] items-start gap-3 rounded-[8px] border border-[rgba(232,228,220,0.1)] bg-[#111318] px-4 py-3.5 text-[#E8E4DC] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)] border-l-2 font-sans text-[14px]",
          title: "font-medium leading-snug",
          description: "mt-0.5 text-[13px] text-[rgba(232,228,220,0.62)]",
          icon: "mt-0.5 [&_svg]:size-4",
          success: "border-l-[#B8955A] [&_[data-icon]]:text-[#B8955A]",
          error: "border-l-[#C87F6A] [&_[data-icon]]:text-[#C87F6A]",
          warning: "border-l-[#D2A45E] [&_[data-icon]]:text-[#D2A45E]",
          info: "border-l-[rgba(232,228,220,0.5)]",
          actionButton:
            "ml-auto rounded-[6px] bg-[#B8955A] px-3 py-1.5 text-[13px] font-medium text-[#07080A] transition hover:brightness-110",
          cancelButton: "rounded-[6px] px-3 py-1.5 text-[13px] text-[rgba(232,228,220,0.62)] hover:bg-white/5",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
