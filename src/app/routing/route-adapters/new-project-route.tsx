import { NewProjectPage } from '@/features/projects/presentation/pages/new-project-page';
import { projectsHref } from '../routes';

export function NewProjectRoute() {
  return <NewProjectPage backHref={projectsHref()} />;
}
