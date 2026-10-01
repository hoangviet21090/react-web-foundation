import { describe, expect, it, vi } from 'vitest';
import { validateCreateProject } from '@/features/projects/domain/project';
import { createProjectUseCases } from '@/features/projects/application/project-use-cases';
import type { ProjectRepository } from '@/features/projects/application/ports/project-repository';
import { createProjectFixtures } from '@/mocks/fixtures';
import type { Cancellation } from '@/shared/application/cancellation';

describe('Project domain and use cases', () => {
  it('normalizes names before persistence', () => {
    expect(validateCreateProject({ name: '  Nguyễn An  ', budget: 100 })).toEqual({
      name: 'Nguyễn An',
      budget: 100,
    });
  });
  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 1_000_000_001])(
    'rejects invalid VND amount %s',
    (budget) => {
      expect(() => validateCreateProject({ name: 'Demo User', budget })).toThrow();
    },
  );
  it.each([' ', 'A', 'A'.repeat(101)])('rejects invalid names', (name) => {
    expect(() => validateCreateProject({ name, budget: 100 })).toThrow();
  });
  const makeRepository = (): ProjectRepository => ({
    get: vi.fn().mockResolvedValue(createProjectFixtures()[0]),
    update: vi.fn().mockResolvedValue(createProjectFixtures()[0]),
    remove: vi.fn().mockResolvedValue(undefined),
    list: vi
      .fn()
      .mockResolvedValue({ items: createProjectFixtures(), totalCount: 6, page: 1, pageSize: 10 }),
    create: vi.fn().mockResolvedValue(createProjectFixtures()[0]),
  });
  it('never calls persistence for invalid input', () => {
    const repository = makeRepository();
    expect(() => createProjectUseCases(repository).create({ name: '', budget: 0 })).toThrow();
    expect(repository.create).not.toHaveBeenCalled();
  });
  it('passes normalized input to its port', async () => {
    const repository = makeRepository();
    await createProjectUseCases(repository).create({ name: '  Demo User  ', budget: 100 });
    expect(repository.create).toHaveBeenCalledWith({ name: 'Demo User', budget: 100 });
  });
  it('forwards cancellation and trimmed search', async () => {
    const repository = makeRepository();
    const cancellation: Cancellation = {
      isCancellationRequested: false,
      subscribe: () => () => {},
    };
    await createProjectUseCases(repository).list(
      { page: 1, pageSize: 5, search: ' demo ' },
      cancellation,
    );
    expect(repository.list).toHaveBeenCalledWith(
      { page: 1, pageSize: 5, search: 'demo' },
      cancellation,
    );
  });
  it.each([
    { page: 0, pageSize: 5 },
    { page: 1.5, pageSize: 5 },
    { page: 1, pageSize: 0 },
    { page: 1, pageSize: 101 },
  ])('rejects invalid pagination', (params) => {
    expect(() => createProjectUseCases(makeRepository()).list({ ...params, search: '' })).toThrow();
  });
});
