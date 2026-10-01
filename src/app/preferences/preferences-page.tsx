import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/shared/ui/card';
import { AppearanceControls } from './appearance-controls';
export function PreferencesPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">{t('app.settings')}</h1>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <p>{t('common.preferencesDescription')}</p>
          <AppearanceControls />
        </CardContent>
      </Card>
    </div>
  );
}
