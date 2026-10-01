import { useTranslation } from 'react-i18next';
import { WifiOff } from 'lucide-react';
import { useOnline } from '../hooks/use-online';
import { Alert, AlertDescription } from '../ui/alert';
export function OfflineBanner() {
  const { t } = useTranslation();
  const online = useOnline();
  return online ? null : (
    <Alert role="status">
      <WifiOff aria-hidden="true" />
      <AlertDescription>{t('common.offline')}</AlertDescription>
    </Alert>
  );
}
