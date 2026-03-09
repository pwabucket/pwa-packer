import BNBIcon from "../assets/bnb-bnb-logo.svg";
import { Button } from "./Button";
import { Controller } from "react-hook-form";
import { FormFieldError } from "./FormFieldError";
import { Input } from "./Input";
import { Label } from "./Label";
import { TokenButton } from "./TokenButton";
import USDTIcon from "../assets/tether-usdt-logo.svg";

interface WithdrawFormFieldsProps {
  token: "bnb" | "usdt";
  disabled?: boolean;
  singleAccount?: boolean;
}

const WithdrawFormFields = ({
  token,
  disabled,
  singleAccount = true,
}: WithdrawFormFieldsProps) => {
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
              Amount of {token.toUpperCase()} to Withdraw{" "}
              {!singleAccount ? "(Per Account)" : ""}
            </Label>
            <p className="text-xs text-neutral-400 text-center px-4">
              The amount of {token.toUpperCase()} to withdraw. If left blank,
              the entire available balance will be withdrawn.
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
