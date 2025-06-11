import { formatDistanceToNowStrict } from "date-fns";
import { pl } from "date-fns/locale";

export const formatDiff = (timestamp: number): string => {
  return formatDistanceToNowStrict(new Date(timestamp), { locale: pl, addSuffix: true });
};
