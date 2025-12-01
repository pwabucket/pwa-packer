import type { PlanFileContent } from "../types";
import { formatCurrency } from "../lib/utils";
import { Progress } from "./Progress";
import { PlanResults } from "./PlanResults";
import { Button } from "./Button";
import { PlanInfo } from "./PlanInfo";
import { usePlanValidator } from "../hooks/usePlanValidator";

const PlanValidator = ({ plan }: { plan: PlanFileContent }) => {
  const { mutation, progress, target, validatePlan } = usePlanValidator(plan);

  return (
    <div className="flex flex-col gap-4">
      {/* Plan Info */}
      <PlanInfo plan={plan} />

      {mutation.data ? (
        <>
          {/* Plan Results Summary */}
          <div className="flex flex-col text-center text-sm">
            <p className="text-green-400">Plan validated successfully!</p>
            <p className="text-blue-300">
              Amount:{" "}
              <span>
                {formatCurrency(mutation.data.stats.progressAmount, 3)}
              </span>{" "}
              /{" "}
              <span className="text-fuchsia-300">
                {formatCurrency(mutation.data.stats.totalAmount, 3)}
              </span>
            </p>
            <p className="text-lime-300">
              Available:{" "}
              <span>
                {formatCurrency(mutation.data.stats.availableAmount, 3)}
              </span>
            </p>
            <p className="text-yellow-300">
              Accounts: {mutation.data.stats.successfulCount} /{" "}
              {mutation.data.stats.totalAccounts}
            </p>

            <p className="text-red-300">
              Failed Validations: {mutation.data.stats.failedCount}
            </p>
          </div>
        </>
      ) : null}

      <Button disabled={mutation.isPending} onClick={validatePlan}>
        {mutation.isPending ? "Validating..." : "Validate Plan"}
      </Button>

      {mutation.isPending ? <Progress max={target} current={progress} /> : null}

      <PlanResults
        validated={mutation.isSuccess}
        disabled={mutation.isPending}
        results={mutation.data?.results || plan.results}
      />
    </div>
  );
};

export { PlanValidator };
