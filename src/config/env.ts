import { parseEnv } from '@/config/env-schema';

const allowMocks = import.meta.env.MODE === 'mock' || import.meta.env.MODE === 'demo';
export const env = parseEnv(import.meta.env, {
  allowMocks,
  requireHttps: import.meta.env.PROD && !allowMocks,
});
