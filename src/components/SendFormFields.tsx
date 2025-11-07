import { Label } from "./Label";
import { Input } from "./Input";
import { Button } from "./Button";
import USDTIcon from "../assets/tether-usdt-logo.svg";
import { cn, HEXADECIMAL_CHARS } from "../lib/utils";
import { Controller } from "react-hook-form";
import { FormFieldError } from "./FormFieldError";
import { Select } from "./Select";
import { LabelToggle } from "./LabelToggle";

interface SendFormFieldsProps {
  disabled?: boolean;
  append: (char: string) => void;
  remove: (index: number) => void;
}

const SendFormFields = ({ disabled, append, remove }: SendFormFieldsProps) => {
  return (
    <>
      {/* Amount */}
      <Controller
        name="amount"
        render={({ field, fieldState }) => (
          <div className="flex flex-col gap-2">
            <Label htmlFor="amount">
              <img src={USDTIcon} className="size-4 inline-block" /> Amount to
              Send
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

      {/* Gas Limit */}
      <Controller
        name="gasLimit"
        render={({ field, fieldState }) => (
          <div className="flex flex-col gap-2">
            <Label htmlFor="gasLimit">Gas Limit</Label>
            <Select id="gasLimit" {...field} disabled={disabled}>
              <Select.Option value="average">Average</Select.Option>
              <Select.Option value="fast">Fast</Select.Option>
              <Select.Option value="instant">Instant</Select.Option>
            </Select>
            <FormFieldError message={fieldState.error?.message} />
          </div>
        )}
      />

      {/* Target Character */}
      <Controller
        name="targetCharacters"
        render={({ field, fieldState }) => (
          <div className="flex flex-col gap-2">
            <Label htmlFor="target-character">Target Character (HEX):</Label>

            <div className="grid grid-cols-4 gap-4">
              {HEXADECIMAL_CHARS.split("").map((char) => (
                <button
                  key={char}
                  type="button"
                  className={cn(
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "p-2 border rounded-md cursor-pointer",
                    "font-bold font-mono",
                    field.value.includes(char)
                      ? "border-yellow-500"
                      : "border-neutral-700"
                  )}
                  onClick={() =>
                    field.value.includes(char)
                      ? remove(field.value.indexOf(char))
                      : append(char)
                  }
                  disabled={disabled}
                >
                  {char}
                </button>
              ))}
            </div>

            <FormFieldError message={fieldState.error?.message} />
          </div>
        )}
      />

      {/* Validate */}
      <Controller
        name="validate"
        render={({ field, fieldState }) => (
          <div className="flex flex-col gap-2">
            <LabelToggle
              checked={field.value}
              onChange={field.onChange}
              disabled={disabled}
            >
              Validate Confirmation?
            </LabelToggle>
            <FormFieldError message={fieldState.error?.message} />
          </div>
        )}
      />

      {/* Submit Button */}
      <Button type="submit" className="mt-4" disabled={disabled}>
        {disabled ? "Sending..." : "Send Funds"}
      </Button>
    </>
  );
};

export { SendFormFields };
