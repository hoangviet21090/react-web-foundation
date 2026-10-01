import { DomainError } from '@/shared/domain/domain-error';

export type ProjectStatus = 'draft' | 'active' | 'archived';
export interface Project {
  readonly id: string;
  readonly reference: string;
  readonly name: string;
  readonly budget: number;
  readonly currency: 'USD';
  readonly status: ProjectStatus;
  readonly createdAt: string;
  readonly version: number;
}
export interface CreateProjectInput {
  name: string;
  budget: number;
}
export interface UpdateProjectInput extends CreateProjectInput {
  status: ProjectStatus;
  version: number;
}

export function validateCreateProject(input: CreateProjectInput): CreateProjectInput {
  const name = input.name.trim();
  if (name.length < 2 || name.length > 100) {
    throw new DomainError('INVALID_PROJECT_NAME', 'Project name must contain 2–100 characters.');
  }
  if (!Number.isSafeInteger(input.budget) || input.budget <= 0 || input.budget > 1_000_000_000) {
    throw new DomainError(
      'INVALID_PROJECT_BUDGET',
      'Budget must be a whole USD value between 1 and 1,000,000,000.',
    );
  }
  return { name, budget: input.budget };
}
export function validateProjectVersion(version: number): number {
  if (!Number.isSafeInteger(version) || version < 1)
    throw new DomainError('INVALID_VERSION', 'Invalid project version.');
  return version;
}
export function validateUpdateProject(input: UpdateProjectInput): UpdateProjectInput {
  if (!['draft', 'active', 'archived'].includes(input.status))
    throw new DomainError('INVALID_STATUS', 'Invalid project status.');
  return {
    ...validateCreateProject(input),
    status: input.status,
    version: validateProjectVersion(input.version),
  };
}
