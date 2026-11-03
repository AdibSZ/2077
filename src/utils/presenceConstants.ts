import { PresenceStatus } from '../types';

export interface PresenceConfig {
  id: PresenceStatus;
  faLabel: string;
  enLabel: string;
  color: string;
  bg: string;
  border: string;
  icon: string;
  description: string;
}

export const PRESENCE_CONFIGS: Record<PresenceStatus, PresenceConfig> = {
  ON_DUTY: {
    id: 'ON_DUTY',
    faLabel: 'آماده به کار',
    enLabel: 'ON DUTY',
    color: '#5DF8D8',
    bg: 'rgba(93, 248, 216, 0.15)',
    border: 'rgba(93, 248, 216, 0.4)',
    icon: 'check_circle',
    description: 'حاضر در شیفت و آماده دریافت مأموریت و وظایف جدید',
  },
  IN_OPERATION: {
    id: 'IN_OPERATION',
    faLabel: 'درگیر عملیات و تمرکز',
    enLabel: 'IN OPERATION',
    color: '#F62477',
    bg: 'rgba(246, 36, 119, 0.15)',
    border: 'rgba(246, 36, 119, 0.4)',
    icon: 'bolt',
    description: 'در حال اجرای مأموریت فوری یا تسک با تمرکز کامل (لطفاً مزاحم نشوید)',
  },
  BIO_BREAK: {
    id: 'BIO_BREAK',
    faLabel: 'استراحت موقت',
    enLabel: 'BIO-BREAK',
    color: '#FCEE0A',
    bg: 'rgba(252, 238, 10, 0.15)',
    border: 'rgba(252, 238, 10, 0.4)',
    icon: 'coffee',
    description: 'توقف کوتاه، چای یا قهوه و بازگشت زودهنگام به سیستم',
  },
  OFF_LINE: {
    id: 'OFF_LINE',
    faLabel: 'پایان شیفت / آفلاین',
    enLabel: 'OFF-LINE',
    color: '#9E9E9C',
    bg: 'rgba(158, 158, 156, 0.15)',
    border: 'rgba(158, 158, 156, 0.3)',
    icon: 'bedtime',
    description: 'پایان زمان کاری شیفت و خروج موقت از پایانه عملیاتی',
  },
};

export function getPresenceConfig(status?: PresenceStatus): PresenceConfig {
  if (!status || !PRESENCE_CONFIGS[status]) {
    return PRESENCE_CONFIGS.ON_DUTY;
  }
  return PRESENCE_CONFIGS[status];
}
