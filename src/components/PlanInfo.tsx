import { formatCurrency } from "../lib/utils";
import type { PlanFileContent } from "../types";
import { PlanDuration } from "./PlanDuration";

const PlanInfo = ({ plan }: { plan: PlanFileContent }) => {
  return (
    <div className="flex flex-col gap-1 items-center">
      <h3 className="font-bold text-center text-green-400">
        {formatCurrency(plan.stats.totalAmount)}
      </h3>
      <PlanDuration week={plan.week} />
    </div>
  );
};

export { PlanInfo };
