import { describe, expect, it, vi } from 'vitest';
import { validateCreateProject } from '@/entities/project';
import { createProjectUseCases } from '@/usecases/project-usecases';
import type { ProjectService } from '@/usecases/project-usecases';
import { createProjectFixtures } from '@/mocks/fixtures';
import { success } from '@/mocks/response';

describe('Project domain and use cases', () => {
  it('normalizes names before persistence', () => {
    expect(validateCreateProject({ name: '  Nguyễn An  ', budget: 100 })).toEqual({
      name: 'Nguyễn An',
      budget: 100,
    });
  });
  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 1_000_000_001])(
    'rejects invalid USD amount %s',
    (budget) => {
      expect(() => validateCreateProject({ name: 'Demo User', budget })).toThrow();
    },
  );
  it.each([' ', 'A', 'A'.repeat(101)])('rejects invalid names', (name) => {
    expect(() => validateCreateProject({ name, budget: 100 })).toThrow();
  });
  const makeService = (): ProjectService => ({
    get: vi.fn().mockResolvedValue(success(createProjectFixtures()[0])),
    update: vi.fn().mockResolvedValue(success(createProjectFixtures()[0])),
    remove: vi.fn().mockResolvedValue(success({ deleted: true })),
    list: vi
      .fn()
      .mockResolvedValue(
        success({ items: createProjectFixtures(), totalCount: 6, page: 1, pageSize: 10 }),
      ),
    create: vi.fn().mockResolvedValue(success(createProjectFixtures()[0])),
  });
  it('never calls persistence for invalid input', () => {
    const service = makeService();
    expect(() => createProjectUseCases(service).create({ name: '', budget: 0 })).toThrow();
    expect(service.create).not.toHaveBeenCalled();
  });
  it('passes normalized input to its port', async () => {
    const service = makeService();
    await createProjectUseCases(service).create({ name: '  Demo User  ', budget: 100 });
    expect(service.create).toHaveBeenCalledWith({ name: 'Demo User', budget: 100 });
  });
  it('forwards cancellation and trimmed search', async () => {
    const service = makeService();
    const cancellation = new AbortController().signal;
    await createProjectUseCases(service).list(
      { page: 1, pageSize: 5, search: ' demo ' },
      cancellation,
    );
    expect(service.list).toHaveBeenCalledWith(
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
    expect(() => createProjectUseCases(makeService()).list({ ...params, search: '' })).toThrow();
  });
});
