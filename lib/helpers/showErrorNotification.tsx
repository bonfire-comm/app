import Twemoji from '@/components/Twemoji';
import { NotificationProps, showNotification } from '@mantine/notifications';

export default function showErrorNotification(options: NotificationProps) {
  showNotification({
    title: <Twemoji>🚨 Error</Twemoji>,
    color: 'red',
    ...options,
  });
}