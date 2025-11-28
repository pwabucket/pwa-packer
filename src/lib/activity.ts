import { differenceInWeeks, startOfWeek, subDays } from "date-fns";

export function getActivityStreak(list: { ["create_time"]: string }[]) {
  let streak = 0;
  let currentWeek;
  for (const item of list) {
    const itemDate = new Date(item["create_time"] + "-05:00");
    const weekStart = startOfWeek(itemDate, { weekStartsOn: 1 });
    const participationWeek = subDays(weekStart, 7);
    const difference = currentWeek
      ? differenceInWeeks(currentWeek, participationWeek)
      : 0;

    if (difference > 1) {
      break;
    } else {
      streak++;
    }
    currentWeek = participationWeek;
  }

  return streak;
}
