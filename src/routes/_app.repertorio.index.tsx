import { createFileRoute } from '@tanstack/react-router';
import { RepertoireWorkspace } from '@/components/repertorio/Workspace';

export const Route = createFileRoute('/_app/repertorio/')({
  // `novo`: veio de "Novo show" / "Criar primeiro repertório" da Home — abre o formulário.
  validateSearch: (s: Record<string, unknown>): { novo?: boolean } => (s.novo === true || s.novo === 'true' || s.novo === 1 ? { novo: true } : {}),
  component: RepertorioIndex,
});

function RepertorioIndex() {
  const { novo } = Route.useSearch();
  return <RepertoireWorkspace openNew={!!novo} />;
}
