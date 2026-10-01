import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/shared/ui/skeleton';
export function RouteLoading() {
  const { t } = useTranslation();
  return (
    <main role="status" className="mx-auto max-w-5xl space-y-4 p-8">
      <span className="sr-only">{t('common.loading')}</span>
      <Skeleton className="h-12 w-2/3" />
      <Skeleton className="h-64 w-full" />
    </main>
  );
}
