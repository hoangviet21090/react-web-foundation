import { useNavigate, useParams } from 'react-router';
import { useAuth } from '@/features/auth/presentation/hooks/use-auth';
import { hasPermission } from '@/features/auth/domain/auth';
import { ProjectDetailPage } from '@/features/projects/presentation/pages/project-detail-page';
import { featureFlags } from '../../config/feature-flags';
import { APP_ROUTES, projectsHref, editProjectHref } from '../routes';
export function ProjectDetailRoute() {
  const { projectId = '' } = useParams();
  const { state } = useAuth();
  const navigate = useNavigate();
  return (
    <ProjectDetailPage
      id={projectId}
      backHref={projectsHref()}
      editHref={
        hasPermission(state.user, APP_ROUTES.editProject.permission)
          ? editProjectHref(projectId)
          : null
      }
      canDelete={featureFlags.projectDeletion && hasPermission(state.user, 'projects:delete')}
      onDeleted={() => {
        void navigate(projectsHref(), { replace: true });
      }}
    />
  );
}
