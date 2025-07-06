import { formatDistanceToNowStrict, formatDuration } from "date-fns";
import { pl } from "date-fns/locale";

const MS_IN_S = 1000;
const MS_IN_MIN = 60 * MS_IN_S;
const MS_IN_HOUR = 60 * MS_IN_MIN;
const MS_IN_DAY = 24 * MS_IN_HOUR;

export const formatDiff = (timestamp: number): string => {
  return formatDistanceToNowStrict(new Date(timestamp), { locale: pl, addSuffix: true });
};

export const formatUptime = (uptimeInMilliseconds: number): string => {
  if (uptimeInMilliseconds < MS_IN_MIN) return "od mniej niż minuty";
  const duration = {
    days: Math.floor(uptimeInMilliseconds / MS_IN_DAY),
    hours: Math.floor((uptimeInMilliseconds % MS_IN_DAY) / MS_IN_HOUR),
    minutes: Math.floor((uptimeInMilliseconds % MS_IN_HOUR) / MS_IN_MIN)
  };

  return formatDuration(duration, { locale: pl, delimiter: ", " });
};
