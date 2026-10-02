import { env } from '@/config/env';
/** Public build-time switches are rollout controls, never authorization. */
export const featureFlags = Object.freeze({
  projectDeletion: env.VITE_ENABLE_PROJECT_DELETE === 'true',
});
