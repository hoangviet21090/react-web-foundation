import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import vi from './locales/vi.json';
import en from './locales/en.json';
export async function createI18n(language: 'vi' | 'en', appName = 'Web Foundation') {
  const instance = createInstance();
  await instance.use(initReactI18next).init({
    resources: {
      vi: { translation: { ...vi, app: { ...vi.app, name: appName } } },
      en: { translation: { ...en, app: { ...en.app, name: appName } } },
    },
    lng: language,
    fallbackLng: 'vi',
    supportedLngs: ['vi', 'en'],
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  return instance;
}
