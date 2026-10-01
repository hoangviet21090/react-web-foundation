import { createContext } from 'react';
import type { NotificationActions } from '../types/notification';
export const NotificationContext = createContext<NotificationActions | null>(null);
