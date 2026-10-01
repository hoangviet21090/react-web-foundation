import { env } from '@/shared/infrastructure/config/env';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/vi';
import 'dayjs/locale/en';
dayjs.extend(utc);
dayjs.extend(timezone);
export function formatDateTime(value: string, locale: string, timeZone = env.VITE_TIME_ZONE) {
  return dayjs.utc(value).tz(timeZone).locale(locale).format('DD MMM YYYY, HH:mm');
}
