/** Shared presentation contract. Core/infrastructure must not depend on this UI type. */
export interface NotificationInput {
  message: string;
  tone?: 'success' | 'error' | 'info';
}
export interface Notification extends NotificationInput {
  id: number;
}
export interface NotificationActions {
  notify: (input: NotificationInput) => void;
  clear: () => void;
}
