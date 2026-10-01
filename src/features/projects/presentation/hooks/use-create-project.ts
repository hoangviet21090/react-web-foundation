import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateProjectInput } from '@/features/projects/domain/project';
import { requireOnline } from '@/shared/lib/require-online';
import { useProjectUseCases } from './use-project-use-cases';
import { projectKeys } from '../queries/project-keys';
export function useCreateProject() {
  const useCases = useProjectUseCases();
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: 'always',
    mutationFn: (input: CreateProjectInput) => {
      requireOnline();
      return useCases.create(input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectKeys.lists });
    },
  });
}
