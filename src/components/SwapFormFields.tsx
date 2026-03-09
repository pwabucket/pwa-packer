import type { SwapDirection, SwapQuote } from "../lib/SwapRouter";

import BNBIcon from "../assets/bnb-bnb-logo.svg";
import { Button } from "./Button";
import { Controller } from "react-hook-form";
import { FormFieldError } from "./FormFieldError";
import { HiArrowRight } from "react-icons/hi2";
import { Input } from "./Input";
import { Label } from "./Label";
import { TokenButton } from "./TokenButton";
import USDTIcon from "../assets/tether-usdt-logo.svg";

interface SwapFormFieldsProps {
  direction: SwapDirection;
  disabled?: boolean;
  quote?: SwapQuote | null;
  isQuoteLoading?: boolean;
}

const SwapFormFields = ({
  direction,
  disabled,
  quote,
  isQuoteLoading,
}: SwapFormFieldsProps) => {
  const fromToken = direction === "BNB_TO_USDT" ? "bnb" : "usdt";
  const toToken = direction === "BNB_TO_USDT" ? "usdt" : "bnb";

  return (
    <>
      {/* Direction Selector */}
      <Controller
        name="direction"
        render={({ field, fieldState }) => (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-4 py-2">
              <TokenButton
                token="bnb"
                selected={field.value === "BNB_TO_USDT"}
                onClick={() => field.onChange("BNB_TO_USDT")}
                disabled={disabled}
              />
              <TokenButton
                token="usdt"
                selected={field.value === "USDT_TO_BNB"}
                onClick={() => field.onChange("USDT_TO_BNB")}
                disabled={disabled}
              />
            </div>
            <p className="text-xs text-neutral-400 text-center px-4 flex items-center justify-center gap-1.5">
              <img
                src={fromToken === "bnb" ? BNBIcon : USDTIcon}
                className="size-3.5 inline-block"
              />{" "}
              {fromToken.toUpperCase()}
              <HiArrowRight className="size-4 text-neutral-500" />
              <img
                src={toToken === "bnb" ? BNBIcon : USDTIcon}
                className="size-3.5 inline-block"
              />{" "}
              {toToken.toUpperCase()}
            </p>
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
                src={fromToken === "bnb" ? BNBIcon : USDTIcon}
                className="size-4 inline-block"
              />{" "}
              Amount of {fromToken.toUpperCase()} to Swap
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

            {/* Quote Preview */}
            {isQuoteLoading && (
              <p className="text-xs text-neutral-400 text-center animate-pulse">
                Fetching quote...
              </p>
            )}
            {quote && !isQuoteLoading && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-green-400">
                <span>≈</span>
                <img
                  src={toToken === "bnb" ? BNBIcon : USDTIcon}
                  className="size-3.5 inline-block"
                />
                <span>
                  {quote.amountOut} {toToken.toUpperCase()}
                </span>
              </div>
            )}

            <FormFieldError message={fieldState.error?.message} />
          </div>
        )}
      />

      {/* Slippage */}
      <Controller
        name="slippage"
        render={({ field, fieldState }) => (
          <div className="flex flex-col gap-2">
            <Label htmlFor="slippage">Slippage Tolerance (%)</Label>
            <Input
              {...field}
              disabled={disabled}
              id="slippage"
              type="number"
              inputMode="decimal"
              autoComplete="off"
              placeholder="1"
              step="0.1"
              min="0.1"
              max="50"
            />
            <p className="text-xs text-neutral-400 text-center px-4">
              Higher slippage increases the chance of a successful swap but may
              result in a worse rate.
            </p>
            <FormFieldError message={fieldState.error?.message} />
          </div>
        )}
      />

      {/* Submit Button */}
      <Button type="submit" disabled={disabled}>
        {disabled ? (
          "Swapping..."
        ) : (
          <>
            Swap {fromToken.toUpperCase()}{" "}
            <HiArrowRight className="inline-block" /> {toToken.toUpperCase()}
          </>
        )}
      </Button>
    </>
  );
};

export { SwapFormFields };
