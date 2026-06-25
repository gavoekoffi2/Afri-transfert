export const NOTIFICATIONS_QUEUE = 'notifications';

export interface NotificationJobData {
  notificationId: string;
  channel: 'EMAIL' | 'SMS' | 'PUSH';
  to: string;
  subject?: string;
  body: string;
}
