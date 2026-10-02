/** Notification UI contract shared by the provider and consumer hook. */
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
