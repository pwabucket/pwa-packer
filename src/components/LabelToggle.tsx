import { cn } from "../lib/utils";
import { memo } from "react";

import { Toggle } from "./Toggle";

interface LabelToggleProps extends React.InputHTMLAttributes<HTMLInputElement> {
  children: React.ReactNode;
}

const LabelToggle = memo(function LabelToggle({
  children,
  className,
  ...props
}: LabelToggleProps) {
  return (
    <label
      className={cn(
        "dark:bg-neutral-900",
        "flex items-center gap-2 px-2.5 py-2 cursor-pointer rounded-full",
        "has-[input:disabled]:opacity-60"
      )}
    >
      <Toggle {...props} />
      <h4 className={cn("min-w-0 min-h-0 grow flex", className)}>{children}</h4>
    </label>
  );
});

export { LabelToggle };
