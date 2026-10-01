import { useContext } from 'react';
import { NotificationContext } from '../contexts/notification-context';
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('NotificationProvider is required.');
  return context;
}
