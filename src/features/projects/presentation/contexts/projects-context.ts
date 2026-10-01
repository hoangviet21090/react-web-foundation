import { createContext } from 'react';
import type { ProjectUseCases } from '@/features/projects/application/project-use-cases';

export const ProjectsContext = createContext<ProjectUseCases | null>(null);
