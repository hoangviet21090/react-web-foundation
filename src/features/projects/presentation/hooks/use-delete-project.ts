import { useMutation, useQueryClient } from '@tanstack/react-query';
import { requireOnline } from '@/shared/lib/require-online';
import { useProjectUseCases } from './use-project-use-cases';
import { projectKeys } from '../queries/project-keys';
export function useDeleteProject(id: string) {
  const useCases = useProjectUseCases();
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: 'always',
    mutationFn: (version: number) => {
      requireOnline();
      return useCases.remove(id, version);
    },
    onSuccess: async () => {
      await queryClient.cancelQueries({ queryKey: projectKeys.detail(id) });
      queryClient.removeQueries({ queryKey: projectKeys.detail(id) });
      await queryClient.invalidateQueries({ queryKey: projectKeys.lists });
    },
  });
}
