import { useMemo } from "react";
import type { PlanFileContent } from "../types";
import { useAccountsSelector } from "../hooks/useAccountsSelector";
import { PackForm } from "./PackForm";
import { PlanInfo } from "./PlanInfo";

const PlanPacker = ({ plan }: { plan: PlanFileContent }) => {
  const accounts = useMemo(() => plan.results.map((p) => p.account), [plan]);
  const selector = useAccountsSelector(accounts);

  return (
    <div className="flex flex-col gap-4">
      {/* Plan Info */}
      <PlanInfo plan={plan} />
      <PackForm selector={selector} />
    </div>
  );
};

export { PlanPacker };
