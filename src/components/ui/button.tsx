import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Botão único do Cantare. Todas as telas usam este componente (ou `buttonVariants` em <Link>).
 *
 * Estados: default · hover (sobe 1px) · focus-visible (anel dourado) · press (scale .98) ·
 * disabled · loading (mantém a largura, bloqueia clique) · success (check curto).
 * Variantes antigas do shadcn (default/destructive/outline/link) continuam aceitas.
 */
const buttonVariants = cva(
  [
    "motion-lift relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-medium",
    "cursor-pointer outline-none",
    "transition-[transform,background-color,border-color,color,box-shadow,filter] duration-[var(--dur-hover)] ease-[var(--ease-out)]",
    "hover:-translate-y-px active:translate-y-0 active:scale-[0.98] active:duration-[var(--dur-press)]",
    "focus-visible:ring-2 focus-visible:ring-[var(--gold)]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07080A]",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none",
    "aria-busy:pointer-events-none",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "btn-shine bg-[linear-gradient(180deg,#C4A266_0%,#B8955A_100%)] text-[#07080A] shadow-[0_10px_30px_-14px_rgba(184,149,90,0.55)] hover:brightness-110 hover:shadow-[0_14px_34px_-12px_rgba(184,149,90,0.7)]",
        secondary:
          "border border-[rgba(184,149,90,0.45)] bg-[rgba(184,149,90,0.04)] text-[#D9BD8A] hover:border-[rgba(184,149,90,0.8)] hover:bg-[rgba(184,149,90,0.1)] hover:text-[#E8E4DC]",
        ghost:
          "text-[rgba(232,228,220,0.72)] hover:bg-[rgba(232,228,220,0.06)] hover:text-[#E8E4DC]",
        danger:
          "border border-[rgba(200,127,106,0.55)] bg-transparent text-[#D9A08C] hover:border-[#C87F6A] hover:bg-[rgba(200,127,106,0.1)] hover:text-[#F0C4B4]",
        link:
          "h-auto px-0 text-[#B8955A] underline-offset-4 hover:translate-y-0 hover:text-[#C9A66A] hover:underline active:scale-100",
        // aliases shadcn
        default: "",
        destructive: "",
        outline: "",
      },
      size: {
        sm: "h-9 rounded-[6px] px-3.5 text-[13px]",
        md: "h-11 rounded-[6px] px-5 text-[14px]",
        lg: "h-12 rounded-[6px] px-7 text-[15px]",
        icon: "h-11 w-11 rounded-[8px]",
        "icon-sm": "h-9 w-9 rounded-[6px]",
        // aliases shadcn
        default: "h-11 rounded-[6px] px-5 text-[14px]",
        xl: "h-14 rounded-[8px] px-8 text-[16px]",
      },
    },
    compoundVariants: [
      { variant: "default", className: "bg-[linear-gradient(180deg,#C4A266_0%,#B8955A_100%)] text-[#07080A] shadow-[0_10px_30px_-14px_rgba(184,149,90,0.55)] hover:brightness-110" },
      { variant: "destructive", className: "border border-[rgba(200,127,106,0.55)] text-[#D9A08C] hover:bg-[rgba(200,127,106,0.1)]" },
      { variant: "outline", className: "border border-[rgba(232,228,220,0.14)] text-[#E8E4DC] hover:border-[rgba(184,149,90,0.6)] hover:bg-[rgba(232,228,220,0.04)]" },
    ],
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Mostra spinner no lugar do conteúdo, mantém a largura e bloqueia cliques. */
  loading?: boolean;
  /** Texto lido por leitores de tela durante o loading. */
  loadingLabel?: string;
  /** Confirmação breve (check) após uma ação concluída. */
  success?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, loadingLabel, success = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const overlay = loading || success;
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={asChild ? undefined : disabled || loading}
        aria-busy={loading || undefined}
        aria-disabled={asChild && (disabled || loading) ? true : undefined}
        {...props}
      >
        {overlay ? (
          <>
            <span className="invisible inline-flex items-center gap-2" aria-hidden>
              <Slottable>{children}</Slottable>
            </span>
            <span className="absolute inset-0 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden />
                  <span className="sr-only">{loadingLabel ?? "Carregando"}</span>
                </>
              ) : (
                <Check className="animate-in zoom-in-50 fade-in duration-200" aria-label="Concluído" />
              )}
            </span>
          </>
        ) : (
          <Slottable>{children}</Slottable>
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
