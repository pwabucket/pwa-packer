import * as yup from "yup";

import { Controller, FormProvider, useForm } from "react-hook-form";

import type { Account } from "../types";
import { Button } from "./Button";
import { FormFieldError } from "./FormFieldError";
import { Input } from "./Input";
import { Label } from "./Label";
import { Progress } from "./Progress";
import { Slider } from "./Slider";
import { chunkArrayGenerator } from "../lib/utils";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";
import { usePackerProvider } from "../hooks/usePackerProvider";
import { useProgress } from "../hooks/useProgress";
import { yupResolver } from "@hookform/resolvers/yup";

/** Raid Form Schema */
const RaidFormSchema = yup
  .object({
    count: yup.number().required().label("Count"),
    batch: yup.number().required().label("Batch"),
  })
  .required();

/** Raid Form Data */
interface RaidFormData {
  count: number;
  batch: number;
}

const AccountDialogRaidTab = ({ account }: { account: Account }) => {
  const { getProvider } = usePackerProvider();

  const { target, setTarget, progress, incrementProgress, resetProgress } =
    useProgress();

  /** Form */
  const form = useForm<RaidFormData>({
    resolver: yupResolver(RaidFormSchema),
    defaultValues: {
      count: 1,
      batch: 50,
    },
  });

  /* Mutation for Performing Raid */
  const mutation = useMutation({
    mutationKey: ["raid", account.id],
    mutationFn: async ({
      account,
      count,
      batch,
    }: {
      account: Account;
      count: number;
      batch: number;
    }) => {
      /* Setup Progress */
      resetProgress();
      setTarget(count);

      if (!account.provider || !account.url)
        return {
          account,
          count: 0,
          status: false,
        };
      try {
        const Packer = getProvider(account.provider);
        const packer = new Packer(account.url!);
        await packer.initialize();

        const list = Array.from({ length: count });
        for (const chunk of chunkArrayGenerator(list, batch)) {
          await Promise.allSettled(
            chunk.map(() => packer.raid().finally(incrementProgress)),
          );
        }

        return {
          account,
          count,
          status: true,
        };
      } catch {
        return {
          account,
          count: 0,
          status: false,
          skipped: false,
        };
      }
    },
  });

  /** Handle Form Submit */
  const handleFormSubmit = async (data: RaidFormData) => {
    await mutation.mutateAsync({
      ...data,
      account,
    });

    /* Show Alert */
    toast.success("Raided  Successfully.");

    /* Reset Form */
    form.reset();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Mutation completion */}
      {mutation.isSuccess && (
        <div className="flex flex-col gap-1 text-sm text-center">
          <p className="text-green-400">Raid completed successfully!</p>
          <p className="text-purple-300">
            Count: <span className="font-bold">({mutation.data.count})</span>
          </p>
        </div>
      )}

      {/* Form */}
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="flex flex-col gap-2"
        >
          <p className="text-center text-neutral-400 text-sm bg-neutral-800/50 p-4 rounded-lg break-all">
            You are about to perform a raid on the account:{" "}
            <span className="text-lime-300 text-xs">{account.title}</span>
            {account.depositAddress ? (
              <>
                {" "}
                for{" "}
                <span className="text-orange-300 text-xs">
                  {account.depositAddress}
                </span>
              </>
            ) : null}
            .
          </p>
          {/* Count */}
          <Controller
            name="count"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-2">
                <Label htmlFor="count">Count</Label>
                <Input
                  {...field}
                  disabled={mutation.isPending}
                  id="count"
                  type="number"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Count"
                />
                <FormFieldError message={fieldState.error?.message} />
              </div>
            )}
          />

          {/* Batch */}
          <Controller
            name="batch"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1">
                <Label className="text-center">Batch</Label>
                <Slider
                  min={0}
                  max={200}
                  step={5}
                  value={[field.value]}
                  onValueChange={([value]) => field.onChange(value)}
                  disabled={mutation.isPending}
                />
                <p className="text-xs text-center text-neutral-400">
                  {field.value} per batch
                </p>
                <FormFieldError message={fieldState.error?.message} />
              </div>
            )}
          />

          {/* Submit Button */}
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Raiding..." : "Raid"}
          </Button>
        </form>
      </FormProvider>

      {/* Progress Bar */}
      {mutation.isPending && <Progress max={target} current={progress} />}
    </div>
  );
};

export { AccountDialogRaidTab };
