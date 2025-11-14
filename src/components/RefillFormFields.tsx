import { Button } from "./Button";
import { Controller } from "react-hook-form";
import { Input } from "./Input";
import { Label } from "./Label";
import { FormFieldError } from "./FormFieldError";
import USDTIcon from "../assets/tether-usdt-logo.svg";

interface RefillFormFieldsProps {
  disabled?: boolean;
}

const RefillFormFields = ({ disabled }: RefillFormFieldsProps) => {
  return (
    <>
      {/* Amount */}
      <Controller
        name="amount"
        render={({ field, fieldState }) => (
          <div className="flex flex-col gap-2">
            <Label htmlFor="amount">
              <img src={USDTIcon} className="size-4 inline-block" /> Amount to
              Refill
            </Label>
            <Input
              {...field}
              disabled={disabled}
              id="amount"
              type="number"
              inputMode="decimal"
              autoComplete="off"
              placeholder="Amount"
            />

            <FormFieldError message={fieldState.error?.message} />
          </div>
        )}
      />

      {/* Submit Button */}
      <Button type="submit" disabled={disabled}>
        {disabled ? "Processing..." : "Refill Accounts"}
      </Button>
    </>
  );
};

export { RefillFormFields };
