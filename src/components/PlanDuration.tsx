import { addDays, format } from "date-fns";
import { MdCalendarToday } from "react-icons/md";

const PlanDuration = ({ week }: { week: Date }) => (
  <div className="flex flex-col items-center gap-1 font-bold text-sm">
    <div className="flex items-center gap-2">
      <MdCalendarToday className="size-4 text-blue-400" />
      <span>{format(new Date(week), "PPP")}</span>
    </div>
    <div className="flex items-center gap-2">
      <MdCalendarToday className="size-4 text-green-400" />
      <span>{format(addDays(new Date(week), 4), "PPP")}</span>
    </div>
  </div>
);

export { PlanDuration };
