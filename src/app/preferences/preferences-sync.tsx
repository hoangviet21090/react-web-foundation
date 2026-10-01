import { useEffect } from 'react';
import { useAppSelector } from '../store/store-hooks';
export function PreferencesSync() {
  const preferences = useAppSelector((state) => state.preferences);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', preferences.theme === 'dark');
    document.documentElement.lang = preferences.language;
  }, [preferences]);
  return null;
}
