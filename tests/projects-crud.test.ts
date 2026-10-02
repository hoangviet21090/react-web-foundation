import { describe, expect, it, vi } from 'vitest';
import { createProjectUseCases } from '@/usecases/project-usecases';
import { createProjectService } from '@/services/project-service';
import { createHttpClient } from '@/config/http/http-client';
import { issueMockSession } from '@/mocks/auth-handlers';
import { validateUpdateProject, validateProjectVersion } from '@/entities/project';
import type { ProjectService } from '@/usecases/project-usecases';
function api(account: 'demo' | 'viewer' = 'demo') {
  const http = createHttpClient({ baseURL: 'http://localhost/api', timeoutMs: 1000 });
  http.defaults.headers.common.Authorization = 'Bearer ' + issueMockSession(account).accessToken;
  return createProjectUseCases(createProjectService(http));
}
describe('Project CRUD contract and concurrency', () => {
  it('creates, loads, updates and deletes through validated HTTP adapters', async () => {
    const projects = api();
    const created = await projects.create({ name: '  Website refresh ', budget: 1000 });
    expect(created).toMatchObject({ name: 'Website refresh', version: 1 });
    expect(await projects.get(created.id)).toEqual(created);
    const updated = await projects.update(created.id, {
      name: 'Website launch',
      budget: 2500,
      status: 'active',
      version: created.version,
    });
    expect(updated).toMatchObject({ status: 'active', budget: 2500, version: 2 });
    await expect(
      projects.update(created.id, { name: 'Stale edit', budget: 3, status: 'draft', version: 1 }),
    ).rejects.toMatchObject({ kind: 'conflict', retryable: false });
    await expect(projects.remove(created.id, 1)).rejects.toMatchObject({ kind: 'conflict' });
    expect(await projects.get(created.id)).toEqual(updated);
    await projects.remove(created.id, 2);
    await expect(projects.get(created.id)).rejects.toMatchObject({ kind: 'not-found' });
    await expect(projects.remove(created.id, 2)).rejects.toMatchObject({ kind: 'not-found' });
  });
  it('enforces read-only permissions at the mock API as well as the UI', async () => {
    const projects = api('viewer');
    const project = await projects.get('demo-001');
    await expect(
      projects.update(project.id, { ...project, status: 'active' }),
    ).rejects.toMatchObject({ kind: 'forbidden' });
    await expect(projects.remove(project.id, project.version)).rejects.toMatchObject({
      kind: 'forbidden',
    });
  });
  it('does not allow two concurrent updates to overwrite one another', async () => {
    const projects = api();
    const current = await projects.get('demo-001');
    const input = {
      name: 'Concurrent edit',
      budget: 42,
      status: 'active' as const,
      version: current.version,
    };
    const results = await Promise.allSettled([
      projects.update(current.id, input),
      projects.update(current.id, input),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    expect((await projects.get(current.id)).version).toBe(2);
  });
  it('rejects invalid IDs and versions before persistence', () => {
    const service: ProjectService = {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };
    const projects = createProjectUseCases(service);
    expect(() => projects.get('')).toThrow();
    expect(() => projects.remove('demo', 0)).toThrow();
    expect(() =>
      projects.update('demo', { name: 'Valid', budget: 3, status: 'active', version: 0 }),
    ).toThrow();
    expect(service.remove).not.toHaveBeenCalled();
    expect(service.update).not.toHaveBeenCalled();
    for (const version of [-1, 0, 1.5, NaN, Infinity])
      expect(() => validateProjectVersion(version)).toThrow();
    expect(() =>
      validateUpdateProject({ name: 'Valid', budget: 1, status: 'bad' as 'active', version: 1 }),
    ).toThrow();
  });
});
