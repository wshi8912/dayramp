import { parseISO } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc, format as tzFormat } from 'date-fns-tz';

export const detectBrowserTZ = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

// Local (TZ) -> UTC ISO
export const toUTC = (localISO: string, tz: string) =>
  zonedTimeToUtc(localISO, tz).toISOString();

// UTC ISO -> Local (TZ) for display
export const fromUTC = (utcISO: string, tz: string) => {
  const d = utcToZonedTime(parseISO(utcISO), tz);
  return {
    localISO: tzFormat(d, "yyyy-MM-dd'T'HH:mm", { timeZone: tz }),
    dateKey: tzFormat(d, 'yyyy-MM-dd', { timeZone: tz }),
  };
};

// UTC range for "user's today"
export const userDayUtcRange = (utcNowISO: string, tz: string) => {
  const nowZoned = utcToZonedTime(parseISO(utcNowISO), tz);
  const dayStr = tzFormat(nowZoned, 'yyyy-MM-dd', { timeZone: tz });
  const startLocal = `${dayStr}T00:00:00`;
  const endLocal = `${dayStr}T23:59:59`;

  // Convert while considering DST gaps/overlaps
  const startUtc = zonedTimeToUtc(startLocal, tz).toISOString();
  const endUtc = zonedTimeToUtc(endLocal, tz).toISOString();
  return { startUtc, endUtc, dayKey: dayStr };
};

export const formatDayKey = (dayKey: string, tz: string, formatStr = 'MMM d') => {
  const localISO = `${dayKey}T00:00:00`;
  try {
    const zoned = zonedTimeToUtc(localISO, tz);
    return tzFormat(zoned, formatStr, { timeZone: tz });
  } catch {
    try {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: tz,
      }).format(new Date(`${dayKey}T00:00:00Z`));
    } catch {
      return dayKey;
    }
  }
};
