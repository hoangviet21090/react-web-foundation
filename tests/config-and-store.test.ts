import { describe, expect, it, vi } from 'vitest';
import { parseEnv } from '@/shared/infrastructure/config/env-schema';
import { createPreferencesStorage } from '@/app/preferences/preferences-storage';
import { createAppStore } from '@/app/store/store';
import { updatePreferences } from '@/app/preferences/preferences-thunks';
import { createQueryClient } from '@/shared/infrastructure/query-client';
import { AppError } from '@/shared/application/app-error';
import viLocale from '@/shared/infrastructure/i18n/locales/vi.json';
import enLocale from '@/shared/infrastructure/i18n/locales/en.json';
import { formatDateTime } from '@/shared/lib/format-date-time';

describe('Configuration and client state', () => {
  it('rejects malformed configuration without echoing values', () => {
    expect(() => parseEnv({ VITE_ENABLE_MOCKS: 'yes' })).toThrow('VITE_ENABLE_MOCKS');
    expect(() => parseEnv({ VITE_API_BASE_URL: '//untrusted.example' })).toThrow();
    expect(parseEnv({}).VITE_ENABLE_MOCKS).toBe('false');
  });
  it('uses thunk dependencies without duplicating server state in Redux', async () => {
    const dependencies = {
      savePreferences: vi.fn(),
      changeLanguage: vi.fn().mockResolvedValue(undefined),
    };
    const store = createAppStore({ language: 'vi', theme: 'light' }, dependencies);
    await store.dispatch(updatePreferences({ language: 'en', theme: 'dark' }));
    expect(store.getState()).toEqual({ preferences: { language: 'en', theme: 'dark' } });
    expect(dependencies.savePreferences).toHaveBeenCalledWith({ language: 'en', theme: 'dark' });
  });
  it('tolerates unavailable storage and malformed persisted values', () => {
    const fallback = { language: 'vi', theme: 'light' } as const;
    const broken = createPreferencesStorage({
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('quota');
      },
    });
    expect(broken.load(fallback)).toEqual(fallback);
    expect(() => broken.save(fallback)).not.toThrow();
    expect(
      createPreferencesStorage({ getItem: () => '{"language":"xx"}', setItem: vi.fn() }).load(
        fallback,
      ),
    ).toEqual(fallback);
  });
  it('retries only transient reads and never automatically retries writes', () => {
    const options = createQueryClient().getDefaultOptions();
    const retry = options.queries?.retry;
    if (typeof retry !== 'function') throw new Error('Expected retry policy');
    expect(retry(0, new AppError('network', 'offline', { retryable: true }))).toBe(true);
    expect(retry(0, new AppError('server', 'unavailable', { retryable: true }))).toBe(true);
    expect(retry(2, new AppError('server', 'unavailable', { retryable: true }))).toBe(false);
    expect(retry(0, new AppError('unauthorized', 'expired'))).toBe(false);
    expect(retry(0, new AppError('contract', 'invalid'))).toBe(false);
    expect(options.mutations?.retry).toBe(false);
  });
  it('keeps all translation keys aligned', () => {
    for (const namespace of Object.keys(viLocale) as (keyof typeof viLocale)[]) {
      expect(Object.keys(enLocale[namespace]).sort()).toEqual(
        Object.keys(viLocale[namespace]).sort(),
      );
    }
  });
  it('formats backend UTC instants in the business timezone', () => {
    expect(formatDateTime('2026-09-30T00:00:00Z', 'en', 'Asia/Ho_Chi_Minh')).toContain('07:00');
  });
});
