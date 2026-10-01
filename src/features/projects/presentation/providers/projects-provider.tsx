import type { PropsWithChildren } from 'react';
import type { ProjectUseCases } from '@/features/projects/application/project-use-cases';
import { ProjectsContext } from '../contexts/projects-context';

export function ProjectsProvider({
  useCases,
  children,
}: PropsWithChildren<{ useCases: ProjectUseCases }>) {
  return <ProjectsContext value={useCases}>{children}</ProjectsContext>;
}
