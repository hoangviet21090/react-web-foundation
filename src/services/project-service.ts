import { PROJECT_ENDPOINTS } from '@/constants/endpoints';
import type { HttpClient } from '@/config/http/http-client';
import { parseResponse } from '@/config/http/response';
import type { ApiResponse } from '@/usecases/response';
import type { Page } from '@/usecases/page';
import { withApplicationErrors } from '@/config/http/application-errors';
import type { ProjectListParams, ProjectService } from '@/usecases/project-usecases';
import type { CreateProjectInput, UpdateProjectInput } from '@/entities/project';
import {
  projectResponseSchema,
  projectListResponseSchema,
  deleteProjectResponseSchema,
} from '@/services/project-response-schema';
import type { Project } from '@/entities/project';

export function createProjectService(http: HttpClient): ProjectService {
  return {
    async list(
      params: ProjectListParams,
      signal?: AbortSignal,
    ): Promise<ApiResponse<Page<Project>>> {
      return withApplicationErrors(async () => {
        const response = await http.get<unknown>(PROJECT_ENDPOINTS.collection, {
          params,
          ...(signal ? { signal } : {}),
        });
        return parseResponse(response.data, projectListResponseSchema);
      });
    },
    async get(id: string, signal?: AbortSignal): Promise<ApiResponse<Project>> {
      return withApplicationErrors(async () => {
        const response = await http.get<unknown>(
          PROJECT_ENDPOINTS.detail(id),
          signal ? { signal } : {},
        );
        return parseResponse(response.data, projectResponseSchema);
      });
    },
    async create(input: CreateProjectInput): Promise<ApiResponse<Project>> {
      return withApplicationErrors(async () => {
        const response = await http.post<unknown>(PROJECT_ENDPOINTS.collection, input);
        return parseResponse(response.data, projectResponseSchema);
      });
    },
    async update(id: string, input: UpdateProjectInput): Promise<ApiResponse<Project>> {
      return withApplicationErrors(async () => {
        const { version, ...body } = input;
        const response = await http.put<unknown>(PROJECT_ENDPOINTS.detail(id), body, {
          headers: { 'If-Match': '"' + version + '"' },
        });
        return parseResponse(response.data, projectResponseSchema);
      });
    },
    async remove(id: string, version: number): Promise<ApiResponse<{ deleted: true }>> {
      return withApplicationErrors(async () => {
        const response = await http.delete<unknown>(PROJECT_ENDPOINTS.detail(id), {
          headers: { 'If-Match': '"' + version + '"' },
        });
        return parseResponse(response.data, deleteProjectResponseSchema);
      });
    },
  };
}
