import { parseISO } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc, format as tzFormat } from 'date-fns-tz';

export const detectBrowserTZ = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

// ローカル（TZ）→ UTC ISO
export const toUTC = (localISO: string, tz: string) =>
  zonedTimeToUtc(localISO, tz).toISOString();

// UTC ISO → ローカル（TZ）表示用
export const fromUTC = (utcISO: string, tz: string) => {
  const d = utcToZonedTime(parseISO(utcISO), tz);
  return {
    localISO: tzFormat(d, "yyyy-MM-dd'T'HH:mm", { timeZone: tz }),
    dateKey: tzFormat(d, 'yyyy-MM-dd', { timeZone: tz }),
  };
};

// “ユーザーの今日”の UTC 範囲
export const userDayUtcRange = (utcNowISO: string, tz: string) => {
  const nowZoned = utcToZonedTime(parseISO(utcNowISO), tz);
  const dayStr = tzFormat(nowZoned, 'yyyy-MM-dd', { timeZone: tz });
  const startLocal = `${dayStr}T00:00:00`;
  const endLocal = `${dayStr}T23:59:59`;

  // DST の“飛ぶ/重なる”時間を考慮しつつ変換
  const startUtc = zonedTimeToUtc(startLocal, tz).toISOString();
  const endUtc = zonedTimeToUtc(endLocal, tz).toISOString();
  return { startUtc, endUtc, dayKey: dayStr };
};

