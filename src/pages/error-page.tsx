import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { APP_ROUTES } from '@/constants/routes';

export function ErrorPage() {
  const { t } = useTranslation();
  return (
    <main className="mx-auto max-w-xl space-y-5 p-10">
      <h1 className="text-2xl font-semibold">{t('app.fatal')}</h1>
      {/* Also used outside RouterProvider: a fatal recovery must restart bootstrap. */}
      <Button onClick={() => window.location.assign(APP_ROUTES.projects.path)}>
        {t('app.back')}
      </Button>
    </main>
  );
}
