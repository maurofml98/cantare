import { createFileRoute } from '@tanstack/react-router';
import { RepertoireWorkspace } from '@/components/repertorio/Workspace';

export const Route = createFileRoute('/_app/repertorio/$projectId')({
  component: ProjectRoute,
});

function ProjectRoute() {
  const { projectId } = Route.useParams();
  return <RepertoireWorkspace selectedId={projectId} />;
}
