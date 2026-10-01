import { useAuth } from '@/features/auth/presentation/hooks/use-auth';
import { hasPermission } from '@/features/auth/domain/auth';
import { ProjectsPage } from '@/features/projects/presentation/pages/projects-page';
import { APP_ROUTES, projectHref } from '../routes';

export function ProjectsRoute() {
  const { state } = useAuth();
  return (
    <ProjectsPage
      detailHref={projectHref}
      createProjectHref={
        hasPermission(state.user, APP_ROUTES.newProject.permission)
          ? APP_ROUTES.newProject.path
          : null
      }
    />
  );
}
