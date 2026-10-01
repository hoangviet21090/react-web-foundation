import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ProjectListParams } from '@/features/projects/application/ports/project-repository';
import { fromAbortSignal } from '@/shared/infrastructure/cancellation';
import { useProjectUseCases } from './use-project-use-cases';
import { projectKeys } from '../queries/project-keys';

export function useProjects(params: ProjectListParams) {
  const useCases = useProjectUseCases();
  return useQuery({
    queryKey: projectKeys.list(params),
    queryFn: ({ signal }) => useCases.list(params, fromAbortSignal(signal)),
    placeholderData: keepPreviousData,
  });
}
