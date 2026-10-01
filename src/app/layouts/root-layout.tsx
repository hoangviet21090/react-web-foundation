import { Outlet, ScrollRestoration, useMatches } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@/shared/hooks/use-document-title';
import { APP_ROUTES } from '../routing/routes';
import { NavigationProgress } from '../routing/navigation-progress';
export function RootLayout() {
  const { t } = useTranslation();
  const matches = useMatches();
  const route = Object.values(APP_ROUTES).find((item) => item.id === matches.at(-1)?.id);
  const title = route && 'title' in route ? t(route.title) + ' · ' + t('app.name') : t('app.name');
  useDocumentTitle(title);
  return (
    <>
      <NavigationProgress />
      <Outlet />
      <ScrollRestoration />
    </>
  );
}
