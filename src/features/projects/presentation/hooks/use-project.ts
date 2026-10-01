import { useQuery } from '@tanstack/react-query';
import { fromAbortSignal } from '@/shared/infrastructure/cancellation';
import { useProjectUseCases } from './use-project-use-cases';
import { projectKeys } from '../queries/project-keys';
export function useProject(id: string) {
  const useCases = useProjectUseCases();
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: ({ signal }) => useCases.get(id, fromAbortSignal(signal)),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
