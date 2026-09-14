import { createFileRoute } from '@tanstack/react-router';
import { RepertoireWorkspace } from '@/components/repertorio/Workspace';

export const Route = createFileRoute('/_app/repertorio/')({
  component: () => <RepertoireWorkspace />,
});
