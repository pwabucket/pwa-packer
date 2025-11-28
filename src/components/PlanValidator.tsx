import { useDropzone } from "react-dropzone";
import { DragZone } from "./DragZone";
import { useCallback, useState } from "react";
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

const PlanValidator = () => {
  const [plans, setPlans] = useState<PlanResult[] | null>(null);
  const { target, progress, setTarget, resetProgress, incrementProgress } =
    useProgress();

  const calculateStats = (results: PlanValidationResult[]) => {
    const totalAccounts = results.length;
    const totalAmount = results.reduce((total, item) => total + item.amount, 0);
    const progressAmount = results.reduce(
      (total, item) => total + Number(item.activity.activity?.amount || 0),
      0
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
        amount: plan.amount,
        validation: activity.activity && Number(activity.amount) >= plan.amount,
        activity: { activity, streak },
      };
    } catch (error) {
      console.log(`Error validating ${plan.account.title}`, error);

      return {
        status: false,
        account: plan.account,
        amount: plan.amount,
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

  /* On drop */
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();

    reader.addEventListener("load", (e) => {
      try {
        const data = JSON.parse(e.target!.result as string) as PlanFileContent;
        setPlans(data.results);
      } catch {
        toast.error("Invalid plan file!");
      }
    });
    reader.readAsText(file);
  }, []);

  /* Dropzone */
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/json": [".json"],
    },
    maxFiles: 1,
    multiple: false,
  });

  const validatePlans = async () => {
    await mutation.mutateAsync(plans!);
    toast.success("Plans validated successfully!");
  };

  return (
    <div className="flex flex-col gap-4">
      {plans ? (
        <>
          {mutation.data ? (
            <>
              {/* Plan Results Summary */}
              <div className="flex flex-col text-center text-sm">
                <p className="text-green-400">Plan validated successfully!</p>
                <p className="text-lime-300">
                  Amount:{" "}
                  {formatCurrency(mutation.data.stats.progressAmount, 3)} /{" "}
                  {formatCurrency(mutation.data.stats.totalAmount, 3)}
                </p>
                <p className="text-blue-300">
                  Accounts: {mutation.data.stats.successfulCount} /{" "}
                  {mutation.data.stats.totalAccounts}
                </p>
              </div>
            </>
          ) : null}

          <Button disabled={mutation.isPending} onClick={validatePlans}>
            {mutation.isPending ? "Validating..." : "Validate Plan"}
          </Button>

          {mutation.isPending ? (
            <Progress max={target} current={progress} />
          ) : null}

          <PlanResults
            disabled={mutation.isPending}
            results={mutation.data?.results || plans}
          />
        </>
      ) : (
        <>
          <p className="text-xs text-neutral-400 text-center px-4">
            Import your plan file to validate accounts and progress.
          </p>
          <DragZone
            getRootProps={getRootProps}
            getInputProps={getInputProps}
            isDragActive={isDragActive}
          />
        </>
      )}
    </div>
  );
};

export { PlanValidator };
