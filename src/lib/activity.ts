import { differenceInWeeks, startOfWeek, subDays } from "date-fns";

export function getActivityStreak(
  list: { ["date"]: string | Date }[],
  weekStartsOn: 0 | 1 = 1
): number {
  let streak = 0;
  let currentWeek = startOfWeek(new Date(), { weekStartsOn });
  let sortedList = list.slice().sort((a, b) => {
    return new Date(b["date"]).getTime() - new Date(a["date"]).getTime();
  });

  for (const item of sortedList) {
    const itemDate = new Date(item["date"]);
    const weekStart = startOfWeek(itemDate, { weekStartsOn });
    const participationWeek = subDays(weekStart, 7);
    const difference = differenceInWeeks(currentWeek, participationWeek);

    if (difference > 1) {
      break;
    } else {
      streak++;
    }
    currentWeek = participationWeek;
  }

  return streak;
}
