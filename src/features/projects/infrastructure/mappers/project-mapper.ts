import type { Project } from '@/features/projects/domain/project';
import type { ProjectDto } from '../dto/project-dto';
export function toProject(dto: ProjectDto): Project {
  return {
    id: dto.id,
    reference: dto.reference,
    name: dto.name,
    budget: dto.budget,
    currency: dto.currency,
    status: dto.status,
    createdAt: dto.createdAt,
    version: dto.version,
  };
}
