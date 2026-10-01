import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { useAppDispatch, useAppSelector } from '../store/store-hooks';
import { updatePreferences } from './preferences-thunks';
export function AppearanceControls() {
  const { t } = useTranslation();
  const languageId = useId();
  const dispatch = useAppDispatch();
  const preferences = useAppSelector((state) => state.preferences);
  return (
    <>
      <label className="sr-only" htmlFor={languageId}>
        {t('app.language')}
      </label>
      <select
        id={languageId}
        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        value={preferences.language}
        onChange={(event) => {
          void dispatch(updatePreferences({ language: event.target.value === 'en' ? 'en' : 'vi' }));
        }}
      >
        <option value="vi">Tiếng Việt</option>
        <option value="en">English</option>
      </select>
      <Button
        variant="outline"
        size="icon"
        aria-label={t('app.theme')}
        title={t(preferences.theme === 'light' ? 'app.dark' : 'app.light')}
        onClick={() => {
          void dispatch(
            updatePreferences({ theme: preferences.theme === 'light' ? 'dark' : 'light' }),
          );
        }}
      >
        {preferences.theme === 'light' ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
      </Button>
    </>
  );
}
