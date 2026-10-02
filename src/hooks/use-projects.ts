import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { captureQueryScope } from '@/config/query-client';
import { getAppRuntime } from '@/config/runtime';
import type { ProjectListParams } from '@/usecases/project-usecases';
import type { CreateProjectInput, UpdateProjectInput } from '@/entities/project';
import { requireOnline } from '@/utils/require-online';

export const projectKeys = {
  all: ['projects'] as const,
  lists: ['projects', 'list'] as const,
  list: (params: ProjectListParams) => ['projects', 'list', params] as const,
  detail: (id: string) => ['projects', 'detail', id] as const,
};

export function useProjects(params: ProjectListParams) {
  const projects = getAppRuntime().projects;
  return useQuery({
    queryKey: projectKeys.list(params),
    queryFn: ({ signal }) => projects.list(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useProject(id: string) {
  const projects = getAppRuntime().projects;
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: ({ signal }) => projects.get(id, signal),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useCreateProject() {
  const projects = getAppRuntime().projects;
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: 'always',
    onMutate: () => captureQueryScope(queryClient),
    mutationFn: (input: CreateProjectInput) => {
      requireOnline();
      return projects.create(input);
    },
    onSuccess: async (_result, _input, scope) => {
      scope?.assertCurrent();
      await queryClient.invalidateQueries({ queryKey: projectKeys.lists });
      scope?.assertCurrent();
    },
  });
}

export function useUpdateProject(id: string) {
  const projects = getAppRuntime().projects;
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: 'always',
    onMutate: () => captureQueryScope(queryClient),
    mutationFn: (input: UpdateProjectInput) => {
      requireOnline();
      return projects.update(id, input);
    },
    onSuccess: async (project, _input, scope) => {
      scope?.assertCurrent();
      await queryClient.cancelQueries({ queryKey: projectKeys.detail(id) });
      scope?.assertCurrent();
      queryClient.setQueryData(projectKeys.detail(id), project);
      await queryClient.invalidateQueries({ queryKey: projectKeys.lists });
      scope?.assertCurrent();
    },
  });
}

export function useDeleteProject(id: string) {
  const projects = getAppRuntime().projects;
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: 'always',
    onMutate: () => captureQueryScope(queryClient),
    mutationFn: (version: number) => {
      requireOnline();
      return projects.remove(id, version);
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
