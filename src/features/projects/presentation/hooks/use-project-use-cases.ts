import { useContext } from 'react';
import { ProjectsContext } from '../contexts/projects-context';

export function useProjectUseCases() {
  const value = useContext(ProjectsContext);
  if (!value) throw new Error('ProjectsProvider is required.');
  return value;
}
