import { useParams } from 'react-router';
import { EditProjectPage } from '@/features/projects/presentation/pages/edit-project-page';
import { projectHref } from '../routes';
export function EditProjectRoute() {
  const { projectId = '' } = useParams();
  return <EditProjectPage id={projectId} backHref={projectHref(projectId)} />;
}
