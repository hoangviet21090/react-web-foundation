import type { ProjectRepository } from '@/features/projects/application/ports/project-repository';
import type { HttpProjectService } from '../services/http-project-service';
import { toProject } from '../mappers/project-mapper';
import { requireResult } from '@/shared/infrastructure/http/response';
import { withApplicationErrors } from '@/shared/infrastructure/http/application-errors';
import { withAbortSignal } from '@/shared/infrastructure/cancellation';

export function createHttpProjectRepository(service: HttpProjectService): ProjectRepository {
  return {
    list(params, cancellation) {
      return withApplicationErrors(() =>
        withAbortSignal(cancellation, async (signal) => {
          const result = requireResult(await service.list(params, signal));
          return { ...result, items: result.items.map(toProject) };
        }),
      );
    },
    get(id, cancellation) {
      return withApplicationErrors(() =>
        withAbortSignal(cancellation, async (signal) =>
          toProject(requireResult(await service.get(id, signal))),
        ),
      );
    },
    create(input) {
      return withApplicationErrors(async () =>
        toProject(requireResult(await service.create(input))),
      );
    },
    update(id, input) {
      return withApplicationErrors(async () =>
        toProject(requireResult(await service.update(id, input))),
      );
    },
    remove(id, version) {
      return withApplicationErrors(async () => {
        requireResult(await service.remove(id, version));
      });
    },
  };
}
