import { describe, expect, it, vi } from 'vitest';
import { onlineManager } from '@tanstack/react-query';
import { createAppStore } from '@/app/store/store';
import { updatePreferences } from '@/app/preferences/preferences-thunks';
import { createQueryClient } from '@/shared/infrastructure/query-client';
import { AppError } from '@/shared/application/app-error';

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

describe('Preference update ordering', () => {
  it('preserves concurrent theme changes and commits language changes in request order', async () => {
    const first = deferred();
    const second = deferred();
    const dependencies = {
      savePreferences: vi.fn(),
      changeLanguage: vi
        .fn<(language: 'vi' | 'en') => Promise<void>>()
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise),
    };
    const store = createAppStore({ language: 'vi', theme: 'light' }, dependencies);
    const english = store.dispatch(updatePreferences({ language: 'en' }));
    const dark = store.dispatch(updatePreferences({ theme: 'dark' }));
    const vietnamese = store.dispatch(updatePreferences({ language: 'vi' }));
    await vi.waitFor(() => expect(dependencies.changeLanguage).toHaveBeenCalledTimes(1));
    expect(store.getState().preferences).toEqual({ language: 'vi', theme: 'light' });
    first.resolve();
    await english;
    await dark;
    await vi.waitFor(() => expect(dependencies.changeLanguage).toHaveBeenCalledTimes(2));
    expect(store.getState().preferences).toEqual({ language: 'en', theme: 'dark' });
    expect(dependencies.changeLanguage.mock.calls.map(([language]) => language)).toEqual([
      'en',
      'vi',
    ]);
    second.resolve();
    await vietnamese;
    expect(store.getState().preferences).toEqual({ language: 'vi', theme: 'dark' });
    expect(dependencies.savePreferences).toHaveBeenLastCalledWith({
      language: 'vi',
      theme: 'dark',
    });
  });
  it('rejects failed language updates without persisting them, and lets later patches proceed', async () => {
    const first = deferred();
    const dependencies = {
      savePreferences: vi.fn(),
      changeLanguage: vi.fn().mockReturnValue(first.promise),
    };
    const store = createAppStore({ language: 'vi', theme: 'light' }, dependencies);
    const english = store.dispatch(updatePreferences({ language: 'en' }));
    const failure = expect(english).rejects.toThrow('Language failed');
    const dark = store.dispatch(updatePreferences({ theme: 'dark' }));
    await vi.waitFor(() => expect(dependencies.changeLanguage).toHaveBeenCalledTimes(1));
    first.reject(new Error('Language failed'));
    await failure;
    await dark;
    expect(store.getState().preferences).toEqual({ language: 'vi', theme: 'dark' });
    expect(dependencies.savePreferences).toHaveBeenCalledExactlyOnceWith({
      language: 'vi',
      theme: 'dark',
    });
    expect(dependencies.changeLanguage).toHaveBeenCalledTimes(1);
  });
  it('keeps queues independent across stores, even when dependencies are shared', async () => {
    const language = deferred();
    const dependencies = {
      savePreferences: vi.fn(),
      changeLanguage: vi.fn().mockReturnValue(language.promise),
    };
    const firstStore = createAppStore({ language: 'vi', theme: 'light' }, dependencies);
    const secondStore = createAppStore({ language: 'vi', theme: 'light' }, dependencies);
    const pending = firstStore.dispatch(updatePreferences({ language: 'en' }));
    await vi.waitFor(() => expect(dependencies.changeLanguage).toHaveBeenCalledTimes(1));
    await secondStore.dispatch(updatePreferences({ theme: 'dark' }));
    expect(secondStore.getState().preferences.theme).toBe('dark');
    expect(firstStore.getState().preferences.language).toBe('vi');
    language.resolve();
    await pending;
  });
});

describe('Offline write policy', () => {
  it('executes a mutation precondition immediately while offline and never resumes it on reconnect', async () => {
    const queryClient = createQueryClient();
    const wasOnline = onlineManager.isOnline();
    const mutationFn = vi
      .fn()
      .mockRejectedValue(new AppError('network', 'Offline write rejected.'));
    try {
      onlineManager.setOnline(false);
      const mutation = queryClient.getMutationCache().build(queryClient, { mutationFn });
      await expect(mutation.execute(undefined)).rejects.toMatchObject({ kind: 'network' });
      expect(mutation.state).toMatchObject({ status: 'error', isPaused: false });
      expect(mutationFn).toHaveBeenCalledTimes(1);
      onlineManager.setOnline(true);
      await queryClient.resumePausedMutations();
      expect(mutationFn).toHaveBeenCalledTimes(1);
    } finally {
      onlineManager.setOnline(wasOnline);
      queryClient.clear();
    }
  });
});
