import type { ProjectListParams } from '@/features/projects/application/ports/project-repository';
export const projectKeys = {
  all: ['projects'] as const,
  lists: ['projects', 'list'] as const,
  list: (params: ProjectListParams) => ['projects', 'list', params] as const,
  detail: (id: string) => ['projects', 'detail', id] as const,
};
