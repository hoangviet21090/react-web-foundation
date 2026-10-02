import '@/styles.css';
import vi from '@/locales/vi.json';
import en from '@/locales/en.json';
const fallbackCopy = import.meta.env.VITE_DEFAULT_LOCALE === 'en' ? en.app : vi.app;
void import('@/app')
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
