import { z } from 'zod';

function isApiBaseUrl(value: string): boolean {
  if (
    !value ||
    [...value].some(
      (char) => char === '\\' || char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127,
    )
  )
    return false;
  const relative = value.startsWith('/') && !value.startsWith('//');
  if (!relative && !/^https?:\/\//.test(value)) return false;
  // Query/fragment delimiters (even empty ones) are not part of a base URL.
  if (value.includes('?') || value.includes('#')) return false;
  try {
    const url = new URL(value, 'https://same-origin.invalid');
    return (
      ['http:', 'https:'].includes(url.protocol) &&
      url.username === '' &&
      url.password === '' &&
      (!relative || url.origin === 'https://same-origin.invalid')
    );
  } catch {
    return false;
  }
}

const envSchema = z.object({
  VITE_APP_NAME: z.string().trim().min(1).max(100).default('Web Foundation'),
  VITE_ENABLE_PROJECT_DELETE: z.enum(['true', 'false']).default('true'),
  VITE_TIME_ZONE: z
    .string()
    .default('UTC')
    .refine((value) => {
      try {
        new Intl.DateTimeFormat('en', { timeZone: value });
        return true;
      } catch {
        return false;
      }
    }),
  VITE_API_BASE_URL: z.string().default('/api').refine(isApiBaseUrl),
  VITE_API_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120000).default(15000),
  VITE_ENABLE_MOCKS: z.enum(['true', 'false']).default('false'),
  VITE_DEFAULT_LOCALE: z.enum(['vi', 'en']).default('vi'),
});

interface EnvironmentPolicy {
  allowMocks?: boolean;
  requireHttps?: boolean;
}

/** Shared by the Vite config and browser; never include configured values in errors. */
export function parseEnv(input: Record<string, unknown>, policy: EnvironmentPolicy = {}) {
  const parsed = envSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(
      'Invalid public environment keys: ' +
        [...new Set(parsed.error.issues.map((issue) => issue.path.join('.')))].join(', '),
    );
  }
  if (parsed.data.VITE_ENABLE_MOCKS === 'true' && !policy.allowMocks) {
    throw new Error('Invalid VITE_ENABLE_MOCKS: mocks require explicit mock/demo mode.');
  }
  if (policy.requireHttps && parsed.data.VITE_API_BASE_URL.startsWith('http:')) {
    throw new Error(
      'Invalid VITE_API_BASE_URL: release builds require HTTPS or a same-origin path.',
    );
  }
  return parsed.data;
}
