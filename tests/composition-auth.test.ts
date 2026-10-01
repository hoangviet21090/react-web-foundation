import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAppDependencies } from '@/app/composition-root';

afterEach(() => {
  vi.unstubAllGlobals();
});
describe('Auth composition', () => {
  it('clears real Query caches and enforces auth before projects requests', async () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    const app = await createAppDependencies();
    await app.auth.restore();
    expect(app.auth.getSnapshot().status).toBe('anonymous');
    await expect(app.projects.list({ page: 1, pageSize: 5, search: '' })).rejects.toMatchObject({
      kind: 'unauthorized',
    });
    await app.auth.login({ email: 'demo@example.test', password: 'Demo123!' });
    const result = await app.queryClient.fetchQuery({
      queryKey: ['projects'],
      queryFn: () => app.projects.list({ page: 1, pageSize: 5, search: '' }),
    });
    expect(result.totalCount).toBe(6);
    expect(app.queryClient.getQueryCache().getAll()).toHaveLength(1);
    await app.auth.logout();
    expect(app.queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(app.queryClient.getMutationCache().getAll()).toHaveLength(0);
    expect(app.auth.getAccessToken()).toBeNull();
    await app.auth.login({ email: 'viewer@example.test', password: 'Demo123!' });
    await expect(app.projects.create({ name: 'Denied Demo', budget: 10 })).rejects.toMatchObject({
      kind: 'forbidden',
    });
    await app.auth.logout();
  });
});
