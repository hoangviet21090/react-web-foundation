import type { ParseKeys } from 'i18next';
import { Files, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Permission } from '@/features/auth/domain/auth';
import { APP_ROUTES } from './routes';

interface NavigationItem {
  readonly route: { readonly id: string; readonly path: string; readonly permission?: Permission };
  readonly label: ParseKeys;
  readonly icon: LucideIcon;
}
export const APP_NAVIGATION = [
  { route: APP_ROUTES.projects, label: 'app.projects', icon: Files },
  { route: APP_ROUTES.settings, label: 'app.settings', icon: Settings },
] as const satisfies readonly NavigationItem[];
