import type { ApiResponse } from '@/usecases/response';
import type { Page } from '@/usecases/page';
import type { Project, CreateProjectInput, UpdateProjectInput } from '@/entities/project';
import {
  validateCreateProject,
  validateUpdateProject,
  validateProjectVersion,
} from '@/entities/project';
import { AppError } from '@/usecases/app-error';
import { requireResult } from '@/usecases/response';

export interface ProjectListParams {
  page: number;
  pageSize: number;
  search: string;
}

export interface ProjectService {
  list(params: ProjectListParams, signal?: AbortSignal): Promise<ApiResponse<Page<Project>>>;
  get(id: string, signal?: AbortSignal): Promise<ApiResponse<Project>>;
  create(input: CreateProjectInput): Promise<ApiResponse<Project>>;
  update(id: string, input: UpdateProjectInput): Promise<ApiResponse<Project>>;
  remove(id: string, version: number): Promise<ApiResponse<{ deleted: true }>>;
}

function requireId(id: string): string {
  if (!id.trim() || id.length > 200) throw new AppError('validation', 'Invalid project ID.');
  return id;
}
export function createProjectUseCases(service: ProjectService) {
  return {
    list(params: ProjectListParams, signal?: AbortSignal): Promise<Page<Project>> {
      if (
        !Number.isSafeInteger(params.page) ||
        params.page < 1 ||
        !Number.isSafeInteger(params.pageSize) ||
        params.pageSize < 1 ||
        params.pageSize > 100 ||
        params.search.length > 200
      ) {
        throw new AppError('validation', 'Invalid list parameters.');
      }
      return service.list({ ...params, search: params.search.trim() }, signal).then(requireResult);
    },
    get(id: string, signal?: AbortSignal): Promise<Project> {
      return service.get(requireId(id), signal).then(requireResult);
    },
    create(input: CreateProjectInput): Promise<Project> {
      return service.create(validateCreateProject(input)).then(requireResult);
    },
    update(id: string, input: UpdateProjectInput): Promise<Project> {
      return service.update(requireId(id), validateUpdateProject(input)).then(requireResult);
    },
    remove(id: string, version: number): Promise<void> {
      const response = service.remove(requireId(id), validateProjectVersion(version));
      return response.then(requireResult).then(() => undefined);
    },
  };
}
export type ProjectUseCases = ReturnType<typeof createProjectUseCases>;
