import { Button } from "./Button";
import { Controller } from "react-hook-form";
import { Input } from "./Input";
import { Label } from "./Label";
import { FormFieldError } from "./FormFieldError";
import USDTIcon from "../assets/tether-usdt-logo.svg";

interface WithdrawFormFieldsProps {
  disabled?: boolean;
}

const WithdrawFormFields = ({ disabled }: WithdrawFormFieldsProps) => {
  return (
    <>
      {/* Amount */}
      <Controller
        name="amount"
        render={({ field, fieldState }) => (
          <div className="flex flex-col gap-2">
            <Label htmlFor="amount">
              <img src={USDTIcon} className="size-4 inline-block" /> Amount to
              Withdraw (Per Account)
            </Label>
            <p className="text-xs text-neutral-400 text-center px-4">
              The amount of USDT to withdraw. If left blank, the entire
              available balance will be withdrawn.
            </p>
            <Input
              {...field}
              disabled={disabled}
              id="amount"
              type="number"
              inputMode="decimal"
              autoComplete="off"
              placeholder="Amount"
            />
            <p className="text-center text-xs text-blue-400">
              Leave blank to send all available funds
            </p>

            <FormFieldError message={fieldState.error?.message} />
          </div>
        )}
      />

      {/* Address */}
      <Controller
        name="address"
        render={({ field, fieldState }) => (
          <div className="flex flex-col gap-2">
            <Label htmlFor="address">Withdraw Address</Label>
            <Input
              {...field}
              id="address"
              autoComplete="off"
              placeholder="Address"
              disabled={disabled}
            />
            <FormFieldError message={fieldState.error?.message} />
          </div>
        )}
      />

      {/* Submit Button */}
      <Button type="submit" disabled={disabled}>
        {disabled ? "Processing..." : "Withdraw"}
      </Button>
    </>
  );
};

export { WithdrawFormFields };
