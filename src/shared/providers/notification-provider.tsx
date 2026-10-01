import { useCallback, useMemo, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { NotificationContext } from '../contexts/notification-context';
import type { Notification, NotificationInput } from '../types/notification';
import { Button } from '../ui/button';

export function NotificationProvider({ children }: PropsWithChildren) {
  const { t } = useTranslation();
  const sequence = useRef(0);
  const [items, setItems] = useState<Notification[]>([]);
  const notify = useCallback((input: NotificationInput) => {
    const notification = { ...input, id: ++sequence.current };
    setItems((current) => [...current.slice(-3), notification]);
  }, []);
  const clear = useCallback(() => setItems([]), []);
  const value = useMemo(() => ({ notify, clear }), [notify, clear]);
  return (
    <NotificationContext value={value}>
      {children}
      <section
        aria-label={t('common.notifications')}
        className="fixed right-4 bottom-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2"
      >
        {items.map((item) => (
          <div
            key={item.id}
            role={item.tone === 'error' ? 'alert' : 'status'}
            className="flex items-center gap-3 rounded-lg border bg-card p-4 text-card-foreground shadow-lg"
          >
            <p className="flex-1 text-sm">{item.message}</p>
            <Button
              size="icon"
              variant="ghost"
              aria-label={t('common.dismiss')}
              onClick={() => setItems((current) => current.filter((value) => value.id !== item.id))}
            >
              <X aria-hidden="true" />
            </Button>
          </div>
        ))}
      </section>
    </NotificationContext>
  );
}
