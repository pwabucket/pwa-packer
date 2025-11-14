import { Button } from "./Button";
import { Controller } from "react-hook-form";
import { Input } from "./Input";
import { Label } from "./Label";
import { FormFieldError } from "./FormFieldError";
import USDTIcon from "../assets/tether-usdt-logo.svg";
import { TokenButton } from "./TokenButton";
import BNBIcon from "../assets/bnb-bnb-logo.svg";

interface RefillFormFieldsProps {
  token: "bnb" | "usdt";
  disabled?: boolean;
}

const RefillFormFields = ({ token, disabled }: RefillFormFieldsProps) => {
  return (
    <>
      {/* Token Selector */}
      <Controller
        name="token"
        render={({ field, fieldState }) => (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-4 py-2">
              <TokenButton
                token="bnb"
                selected={field.value === "bnb"}
                onClick={() => field.onChange("bnb")}
                disabled={disabled}
              />
              <TokenButton
                token="usdt"
                selected={field.value === "usdt"}
                onClick={() => field.onChange("usdt")}
                disabled={disabled}
              />
            </div>
            <FormFieldError message={fieldState.error?.message} />
          </div>
        )}
      />
      {/* Amount */}
      <Controller
        name="amount"
        render={({ field, fieldState }) => (
          <div className="flex flex-col gap-2">
            <Label htmlFor="amount">
              <img
                src={token === "bnb" ? BNBIcon : USDTIcon}
                className="size-4 inline-block"
              />{" "}
              Amount of {token.toUpperCase()} to Refill
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
