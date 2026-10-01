import { captureQueryScope } from '@/shared/infrastructure/query-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { requireOnline } from '@/shared/lib/require-online';
import { useProjectUseCases } from './use-project-use-cases';
import { projectKeys } from '../queries/project-keys';
export function useDeleteProject(id: string) {
  const useCases = useProjectUseCases();
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: 'always',
    onMutate: () => captureQueryScope(queryClient),
    mutationFn: (version: number) => {
      requireOnline();
      return useCases.remove(id, version);
    },
    onSuccess: async (_result, _input, scope) => {
      scope?.assertCurrent();
      await queryClient.cancelQueries({ queryKey: projectKeys.detail(id) });
      scope?.assertCurrent();
      queryClient.removeQueries({ queryKey: projectKeys.detail(id) });
      await queryClient.invalidateQueries({ queryKey: projectKeys.lists });
      scope?.assertCurrent();
    },
  });
}
