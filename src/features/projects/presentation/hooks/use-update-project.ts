import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateProjectInput } from '@/features/projects/domain/project';
import { requireOnline } from '@/shared/lib/require-online';
import { useProjectUseCases } from './use-project-use-cases';
import { projectKeys } from '../queries/project-keys';
export function useUpdateProject(id: string) {
  const useCases = useProjectUseCases();
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: 'always',
    mutationFn: (input: UpdateProjectInput) => {
      requireOnline();
      return useCases.update(id, input);
    },
    onSuccess: async (project) => {
      await queryClient.cancelQueries({ queryKey: projectKeys.detail(id) });
      queryClient.setQueryData(projectKeys.detail(id), project);
      await queryClient.invalidateQueries({ queryKey: projectKeys.lists });
    },
  });
}
