import { describe, expect, it } from 'vitest';
import { parseEnv } from '@/config/env-schema';
import { createI18n } from '@/config/i18n';
import viLocale from '@/locales/vi.json';
import enLocale from '@/locales/en.json';

describe('Public environment boundaries', () => {
  it.each([
    '',
    '//other.example/api',
    '/\\other.example/api',
    'https://',
    'https://:443/api',
    'https://example.test:invalid/api',
    'https://user:private-value@example.test/api',
    'https://example.test/api?secret=private-value',
    'https://example.test/api?',
    '/api#',
    'https://example.test/api#fragment',
    'https://example.test/\\api',
    ' https://example.test/api',
    '/api path',
    '/api\n',
    'javascript:alert(1)',
    'file:///api',
  ])('rejects malformed or ambiguous API base URL %# without printing its value', (value) => {
    let error: unknown;
    try {
      parseEnv({ VITE_API_BASE_URL: value });
    } catch (cause) {
      error = cause;
    }
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe('Invalid public environment keys: VITE_API_BASE_URL');
  });

  it.each([
    '/api',
    '/gateway/project/api',
    'https://bff.example.test/api',
    'http://localhost:3000/api',
  ])('accepts intentional development base URL %s', (url) =>
    expect(parseEnv({ VITE_API_BASE_URL: url }).VITE_API_BASE_URL).toBe(url),
  );

  it('requires an explicit demo mode and secure release API configuration', () => {
    expect(() => parseEnv({ VITE_ENABLE_MOCKS: 'true' })).toThrow('VITE_ENABLE_MOCKS');
    expect(parseEnv({ VITE_ENABLE_MOCKS: 'true' }, { allowMocks: true }).VITE_ENABLE_MOCKS).toBe(
      'true',
    );
    expect(() =>
      parseEnv({ VITE_API_BASE_URL: 'http://localhost:3000/api' }, { requireHttps: true }),
    ).toThrow('VITE_API_BASE_URL');
    expect(parseEnv({ VITE_API_BASE_URL: '/api' }, { requireHttps: true }).VITE_API_BASE_URL).toBe(
      '/api',
    );
  });

  it.each([
    { VITE_API_TIMEOUT_MS: '0' },
    { VITE_API_TIMEOUT_MS: '120001' },
    { VITE_API_TIMEOUT_MS: 'private-value' },
    { VITE_DEFAULT_LOCALE: 'unsupported' },
    { VITE_APP_NAME: '   ' },
    { VITE_ENABLE_MOCKS: 'yes' },
  ])('fails invalid configuration without echoing values %#', (config) => {
    expect(() => parseEnv(config)).toThrow('Invalid public environment keys');
    try {
      parseEnv(config);
    } catch (error) {
      expect((error as Error).message).not.toContain('private-value');
    }
  });

  it('uses configured branding in both languages without mutating locale resources', async () => {
    const instance = await createI18n('vi', 'Project Portal');
    expect(instance.t('app.name')).toBe('Project Portal');
    await instance.changeLanguage('en');
    expect(instance.t('app.name')).toBe('Project Portal');
    expect(viLocale.app.name).toBe('Web Foundation');
    expect(enLocale.app.name).toBe('Web Foundation');
    const independent = await createI18n('en');
    expect(independent.t('app.name')).toBe('Web Foundation');
  });
});
