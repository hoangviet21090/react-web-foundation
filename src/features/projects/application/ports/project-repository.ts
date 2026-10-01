import type { Cancellation } from '@/shared/application/cancellation';
import type { Page } from '@/shared/application/page';
import type {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
} from '@/features/projects/domain/project';

export interface ProjectListParams {
  page: number;
  pageSize: number;
  search: string;
}
export interface ProjectRepository {
  list(params: ProjectListParams, cancellation?: Cancellation): Promise<Page<Project>>;
  get(id: string, cancellation?: Cancellation): Promise<Project>;
  create(input: CreateProjectInput): Promise<Project>;
  update(id: string, input: UpdateProjectInput): Promise<Project>;
  remove(id: string, version: number): Promise<void>;
}
