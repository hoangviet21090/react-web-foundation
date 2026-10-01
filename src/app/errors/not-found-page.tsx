import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { APP_ROUTES } from '../routing/routes';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">{t('app.notFound')}</h1>
      <Button asChild>
        <Link to={APP_ROUTES.projects.path}>{t('app.back')}</Link>
      </Button>
    </div>
  );
}
