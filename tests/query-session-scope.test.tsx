import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { createAppRuntime } from '@/config/runtime';
import { OperationCancelledError } from '@/usecases/app-error';
import { projectKeys, useUpdateProject } from '@/hooks/use-projects';
import type { Project } from '@/entities/project';

afterEach(() => {
  vi.unstubAllGlobals();
});

const project: Project = {
  id: 'project-1',
  reference: 'PROJECT-1',
  name: 'Updated',
  budget: 200,
  currency: 'USD',
  status: 'draft',
  createdAt: '2026-10-01T00:00:00Z',
  version: 2,
};
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((yes) => {
    resolve = yes;
  });
  return { promise, resolve };
}
describe('Mutation callbacks and session cache lifecycle', () => {
  it.each([false, true])(
    'only writes response data when the original cache scope is current (clear=%s)',
    async (clear) => {
      vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
      const runtime = await createAppRuntime();
      const client = runtime.queryClient;
      const cancellation = deferred();
      const cancel = vi.spyOn(client, 'cancelQueries').mockReturnValueOnce(cancellation.promise);
      vi.spyOn(runtime.projects, 'update').mockResolvedValue(project);
      const wrapper = ({ children }: PropsWithChildren) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      );
      const { result } = renderHook(() => useUpdateProject(project.id), { wrapper });
      let request!: Promise<Project>;
      let rejection: Promise<void> | undefined;
      await act(async () => {
        request = result.current.mutateAsync({
          name: project.name,
          budget: project.budget,
          status: project.status,
          version: 1,
        });
        if (clear) rejection = expect(request).rejects.toBeInstanceOf(OperationCancelledError);
        await vi.waitFor(() => expect(cancel).toHaveBeenCalledTimes(1));
      });
      if (clear) client.clear(); // Same operation used on logout/login identity changes.
      await act(async () => {
        cancellation.resolve();
        if (rejection) await rejection;
        else await request;
      });
      expect(client.getQueryData(projectKeys.detail(project.id))).toEqual(
        clear ? undefined : project,
      );
      client.clear();
    },
  );
});
