import toast from "react-hot-toast";
import type {
  Activity,
  PlanFileContent,
  PlanResult,
  PlanValidationResult,
} from "../types";
import { useMutation } from "@tanstack/react-query";
import { useProgress } from "../hooks/useProgress";
import { Packer } from "../lib/Packer";
import {
  chunkArrayGenerator,
  delayForSeconds,
  formatCurrency,
} from "../lib/utils";
import { Progress } from "./Progress";
import { PlanResults } from "./PlanResults";
import { Button } from "./Button";
import { getActivityStreak } from "../lib/activity";
import Decimal from "decimal.js";

const PlanValidator = ({ plan }: { plan: PlanFileContent }) => {
  const { target, progress, setTarget, resetProgress, incrementProgress } =
    useProgress();

  const calculateStats = (results: PlanValidationResult[]) => {
    const totalAccounts = results.length;
    const totalAmount = results.reduce(
      (total, item) => total.plus(new Decimal(item.amount)),
      new Decimal(0)
    );
    const progressAmount = results.reduce(
      (total, item) =>
        total.plus(new Decimal(item.activity.activity?.amount || 0)),
      new Decimal(0)
    );
    const successfulCount = results.filter((item) => item.validation).length;
    const failedCount = results.filter((item) => !item.validation).length;

    return {
      totalAccounts,
      totalAmount,
      progressAmount,
      successfulCount,
      failedCount,
    };
  };

  /* Validate Plan */
  const validatePlan = async (
    plan: PlanResult
  ): Promise<PlanValidationResult> => {
    try {
      const packer = new Packer(plan.account.url!);
      await packer.initialize();

      const activity: Activity = await packer.getActivity();
      const result = await packer.getWithdrawActivityList();
      const list = result.data.list;
      const streak = getActivityStreak(list);

      return {
        status: true,
        account: plan.account,
        amount: new Decimal(plan.amount),
        validation:
          activity.activity &&
          new Decimal(activity.amount).gte(new Decimal(plan.amount)),
        activity: { activity, streak },
      };
    } catch (error) {
      console.log(`Error validating ${plan.account.title}`, error);

      return {
        status: false,
        account: plan.account,
        amount: new Decimal(plan.amount),
        validation: false,
        activity: {
          activity: null,
          streak: 0,
        },
      };
    }
  };

  /* Mutation */
  const mutation = useMutation({
    mutationKey: ["validate-plan"],
    mutationFn: async (plans: PlanResult[]) => {
      resetProgress();
      setTarget(plans.length);

      const results: PlanValidationResult[] = [];

      for (const chunk of chunkArrayGenerator(plans, 10)) {
        const chunkResults = await Promise.all(
          chunk.map(async (account) => {
            const result = await validatePlan(account);
            incrementProgress();
            return result;
          })
        );

        results.push(...chunkResults);

        await delayForSeconds(1);
      }

      const stats = calculateStats(results);

      return {
        results,
        stats,
      };
    },
  });

  const validatePlans = async () => {
    await mutation.mutateAsync(plan.results!);
    toast.success("Plans validated successfully!");
  };

  return (
    <div className="flex flex-col gap-4">
      {mutation.data ? (
        <>
          {/* Plan Results Summary */}
          <div className="flex flex-col text-center text-sm">
            <p className="text-green-400">Plan validated successfully!</p>
            <p className="text-lime-300">
              Amount: {formatCurrency(mutation.data.stats.progressAmount, 3)} /{" "}
              {formatCurrency(mutation.data.stats.totalAmount, 3)}
            </p>
            <p className="text-blue-300">
              Accounts: {mutation.data.stats.successfulCount} /{" "}
              {mutation.data.stats.totalAccounts}
            </p>

            <p className="text-red-300">
              Failed Validations: {mutation.data.stats.failedCount}
            </p>
          </div>
        </>
      ) : null}

      <Button disabled={mutation.isPending} onClick={validatePlans}>
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
