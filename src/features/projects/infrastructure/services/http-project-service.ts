import type { HttpClient } from '@/shared/infrastructure/http/http-client';
import { parseResponse } from '@/shared/infrastructure/http/response';
import type { ApiResponse, PaginatedResult } from '@/shared/infrastructure/http/response';
import type { ProjectListParams } from '@/features/projects/application/ports/project-repository';
import type { CreateProjectInput, UpdateProjectInput } from '@/features/projects/domain/project';
import { projectDtoSchema, projectListDtoSchema, deleteProjectDtoSchema } from '../dto/project-dto';
import type { ProjectDto } from '../dto/project-dto';

export const PROJECT_ENDPOINTS = {
  collection: '/projects',
  detail: (id: string) => '/projects/' + encodeURIComponent(id),
} as const;
export function createHttpProjectService(http: HttpClient) {
  return {
    async list(
      params: ProjectListParams,
      signal?: AbortSignal,
    ): Promise<ApiResponse<PaginatedResult<ProjectDto>>> {
      const response = await http.get<unknown>(PROJECT_ENDPOINTS.collection, {
        params,
        ...(signal ? { signal } : {}),
      });
      return parseResponse(response.data, projectListDtoSchema);
    },
    async get(id: string, signal?: AbortSignal): Promise<ApiResponse<ProjectDto>> {
      const response = await http.get<unknown>(
        PROJECT_ENDPOINTS.detail(id),
        signal ? { signal } : {},
      );
      return parseResponse(response.data, projectDtoSchema);
    },
    async create(input: CreateProjectInput): Promise<ApiResponse<ProjectDto>> {
      const response = await http.post<unknown>(PROJECT_ENDPOINTS.collection, input);
      return parseResponse(response.data, projectDtoSchema);
    },
    async update(id: string, input: UpdateProjectInput): Promise<ApiResponse<ProjectDto>> {
      const { version, ...body } = input;
      const response = await http.put<unknown>(PROJECT_ENDPOINTS.detail(id), body, {
        headers: { 'If-Match': '"' + version + '"' },
      });
      return parseResponse(response.data, projectDtoSchema);
    },
    async remove(id: string, version: number): Promise<ApiResponse<{ deleted: true }>> {
      const response = await http.delete<unknown>(PROJECT_ENDPOINTS.detail(id), {
        headers: { 'If-Match': '"' + version + '"' },
      });
      return parseResponse(response.data, deleteProjectDtoSchema);
    },
  };
}
export type HttpProjectService = ReturnType<typeof createHttpProjectService>;
