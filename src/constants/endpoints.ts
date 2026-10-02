import { encodePathSegment } from '@/utils/encode-path-segment';

export const AUTH_ENDPOINTS = {
  login: '/auth/login',
  refresh: '/auth/refresh',
  logout: '/auth/logout',
} as const;

export const PROJECT_ENDPOINTS = {
  collection: '/projects',
  detail: (id: string) => '/projects/' + encodePathSegment(id),
} as const;
