import './app/styles.css';
import vi from '@/shared/infrastructure/i18n/locales/vi.json';
import en from '@/shared/infrastructure/i18n/locales/en.json';
const fallbackCopy = import.meta.env.VITE_DEFAULT_LOCALE === 'en' ? en.app : vi.app;
void import('./app/bootstrap')
  .then(({ bootstrap }) => bootstrap())
  .catch(() => {
    const root = document.getElementById('root');
    if (root) {
      const message = document.createElement('p');
      message.setAttribute('role', 'alert');
      message.textContent = fallbackCopy.fatal;
      const retry = document.createElement('button');
      retry.textContent = fallbackCopy.reload;
      retry.addEventListener('click', () => window.location.reload());
      root.replaceChildren(message, retry);
    }
  });
