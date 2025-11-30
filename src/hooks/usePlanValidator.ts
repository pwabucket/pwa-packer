import toast from "react-hot-toast";
import type {
  Activity,
  PlanFileContent,
  PlanResult,
  PlanValidationResult,
} from "../types";
import { useMutation } from "@tanstack/react-query";
import { useProgress } from "./useProgress";
import { Packer } from "../lib/Packer";
import { chunkArrayGenerator, delayForSeconds } from "../lib/utils";
import { getActivityStreak } from "../lib/activity";
import Decimal from "decimal.js";

const usePlanValidator = (plan: PlanFileContent) => {
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

    const availableAmount = results.reduce(
      (total, item) =>
        total.plus(new Decimal(item.activity.activity?.activityBalance || 0)),
      new Decimal(0)
    );
    const successfulCount = results.filter((item) => item.validation).length;
    const failedCount = results.filter((item) => !item.validation).length;

    return {
      totalAccounts,
      totalAmount,
      progressAmount,
      availableAmount,
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

      let validation = false;
      if (activity.activity) {
        const planAmount = new Decimal(plan.amount);
        const activityAmount = new Decimal(activity.amount);
        const activityBalance = new Decimal(activity.activityBalance || 0);

        validation =
          activityBalance.gt(new Decimal(0)) || activityAmount.gte(planAmount);
      }

      return {
        status: true,
        account: plan.account,
        amount: new Decimal(plan.amount),
        validation: validation,
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

  /* Validate Plans */
  const validatePlans = async () => {
    await mutation.mutateAsync(plan.results);
    toast.success("Plans validated successfully!");
  };

  return {
    plan,
    mutation,
    validatePlans,
    progress,
    target,
  };
};

export { usePlanValidator };
