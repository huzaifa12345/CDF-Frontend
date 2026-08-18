import { notification } from 'antd';

notification.config({
  placement: 'topRight',
  duration: 4,
});

export const notify = {
  success(message: string, description?: string) {
    notification.success({ message, description });
  },
  info(message: string, description?: string) {
    notification.info({ message, description });
  },
  warning(message: string, description?: string) {
    notification.warning({ message, description });
  },
  error(message: string, description?: string) {
    notification.error({ message, description });
  },
};
