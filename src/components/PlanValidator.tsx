import { useDropzone } from "react-dropzone";
import { DragZone } from "./DragZone";
import { useCallback } from "react";
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
import { chunkArrayGenerator } from "../lib/utils";
import { Progress } from "./Progress";
import { PlanResults } from "./PlanResults";

const PlanValidator = () => {
  const { target, progress, setTarget, resetProgress, incrementProgress } =
    useProgress();
  const validatePlan = async (
    plan: PlanResult
  ): Promise<PlanValidationResult> => {
    try {
      const packer = new Packer(plan.account.url!);
      await packer.initialize();

      const activity: Activity = await packer.getActivity();

      return {
        status: true,
        skipped: false,
        account: plan.account,
        amount: plan.amount,
        streak: plan.streak,
        validation: activity.activity && Number(activity.amount) >= plan.amount,
        activity: activity,
      };
    } catch (error) {
      console.log(`Error validating ${plan.account.title}`, error);

      return {
        status: false,
        skipped: false,
        account: plan.account,
        amount: plan.amount,
        streak: plan.streak,
        validation: false,
        activity: null,
      };
    }
  };

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
      }

      return {
        results,
      };
    },
  });
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();

    reader.addEventListener("load", (e) => {
      try {
        const data = JSON.parse(e.target!.result as string) as PlanFileContent;
        mutation.mutateAsync(data.results);
      } catch {
        toast.error("Invalid plan file!");
      }
    });
    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/json": [".json"],
    },
    maxFiles: 1,
    multiple: false,
  });

  return (
    <>
      {mutation.data ? (
        <>
          <PlanResults results={mutation.data.results} />
        </>
      ) : mutation.isPending ? (
        <Progress max={target} current={progress} />
      ) : (
        <DragZone
          getRootProps={getRootProps}
          getInputProps={getInputProps}
          isDragActive={isDragActive}
        />
      )}
    </>
  );
};

export { PlanValidator };
