import { useNavigation } from 'react-router';
import { useTranslation } from 'react-i18next';

/** Lazy route transitions keep the previous screen visible until the next route is ready. */
export function NavigationProgress() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const pending = navigation.state !== 'idle';
  return (
    <div role="status" aria-live="polite" aria-atomic="true">
      {pending && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-x-0 top-0 z-50 h-1 animate-pulse bg-primary"
          />
          <span className="sr-only">{t('common.loading')}</span>
        </>
      )}
    </div>
  );
}
