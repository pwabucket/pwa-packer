import { Label } from "./Label";
import { Input } from "./Input";
import { Button } from "./Button";
import USDTIcon from "../assets/tether-usdt-logo.svg";
import { cn, HEXADECIMAL_CHARS } from "../lib/utils";
import { Controller } from "react-hook-form";
import { FormFieldError } from "./FormFieldError";
import { Select } from "./Select";
import { LabelToggle } from "./LabelToggle";
import { Slider } from "./Slider";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";

interface SendFormFieldsProps {
  disabled?: boolean;
  append: (char: string) => void;
  remove: (index: number) => void;
}

const FormControlButton = (props: React.ComponentProps<"button">) => (
  <button
    {...props}
    type="button"
    className={cn(
      "border border-neutral-700 cursor-pointer",
      "shrink-0 p-2 rounded-full size-10",
      "flex items-center justify-center",
      props.className
    )}
  />
);

const SendFormFields = ({ disabled, append, remove }: SendFormFieldsProps) => {
  return (
    <>
      {/* Amount */}
      <Controller
        name="amount"
        render={({ field, fieldState }) => (
          <div className="flex flex-col gap-2">
            <Label htmlFor="amount">
              <img src={USDTIcon} className="size-4 inline-block" /> Max amount
              to send
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

      {/* Difference */}
      <Controller
        name="difference"
        render={({ field, fieldState }) => (
          <div className="flex flex-col gap-2">
            <Label htmlFor="difference">Difference</Label>
            <div className="flex gap-2 items-center">
              <Input
                {...field}
                disabled={disabled}
                id="difference"
                type="number"
                inputMode="decimal"
                autoComplete="off"
                placeholder="Maximum difference allowed"
                className="grow min-w-0"
              />

              <FormControlButton
                type="button"
                onClick={() =>
                  field.onChange((parseFloat(field.value) || 0) - 1)
                }
                disabled={disabled}
              >
                <MdChevronLeft className="size-5" />
              </FormControlButton>

              <FormControlButton
                type="button"
                onClick={() =>
                  field.onChange((parseFloat(field.value) || 0) + 1)
                }
                disabled={disabled}
              >
                <MdChevronRight className="size-5" />
              </FormControlButton>
            </div>
            <FormFieldError message={fieldState.error?.message} />
          </div>
        )}
      />

      {/* Mode */}
      <Controller
        name="mode"
        render={({ field, fieldState }) => (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              {["single", "batch"].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={cn(
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "p-2 border rounded-full cursor-pointer",
                    field.value === mode
                      ? "border-yellow-500 text-yellow-500 font-bold"
                      : "border-neutral-700"
                  )}
                  onClick={() => field.onChange(mode)}
                  disabled={disabled}
                >
                  {mode === "single" ? "Single Mode" : "Batch Mode"}
                </button>
              ))}
            </div>
            <FormFieldError message={fieldState.error?.message} />
          </div>
        )}
      />

      {/* Delay */}
      <Controller
        name="delay"
        render={({ field, fieldState }) => (
          <div className="flex flex-col gap-1">
            <Label className="text-center">
              Delay per transaction (seconds)
            </Label>
            <Slider
              min={0}
              max={60}
              step={5}
              value={[field.value]}
              onValueChange={([value]) => field.onChange(value)}
              disabled={disabled}
            />
            <p className="text-xs text-center text-neutral-400">
              {field.value} seconds
            </p>
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

      {/* Submit Button */}
      <Button type="submit" className="mt-4" disabled={disabled}>
        {disabled ? "Sending..." : "Send Funds"}
      </Button>
    </>
  );
};

export { SendFormFields };
