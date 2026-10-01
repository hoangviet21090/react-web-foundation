import type { ProjectRepository } from './ports/project-repository';
import {
  validateCreateProject,
  validateUpdateProject,
  validateProjectVersion,
} from '@/features/projects/domain/project';
import { AppError } from '@/shared/application/app-error';

function requireId(id: string): string {
  if (!id.trim() || id.length > 200) throw new AppError('validation', 'Invalid project ID.');
  return id;
}
export function createProjectUseCases(repository: ProjectRepository): ProjectRepository {
  return {
    list(params, cancellation) {
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
      return repository.list({ ...params, search: params.search.trim() }, cancellation);
    },
    get(id, cancellation) {
      return repository.get(requireId(id), cancellation);
    },
    create(input) {
      return repository.create(validateCreateProject(input));
    },
    update(id, input) {
      return repository.update(requireId(id), validateUpdateProject(input));
    },
    remove(id, version) {
      return repository.remove(requireId(id), validateProjectVersion(version));
    },
  };
}
export type ProjectUseCases = ReturnType<typeof createProjectUseCases>;
