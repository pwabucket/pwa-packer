import { cn } from "../lib/utils";
import { memo } from "react";

const Toggle = memo(function Toggle({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <>
      <input {...props} type="checkbox" className="sr-only peer" />
      <span
        className={cn(
          "shrink-0",
          "relative rounded-full",
          "inline-flex h-6 w-11 items-center",
          "dark:bg-neutral-800",
          "peer-checked:bg-yellow-500",

          // Before
          "peer-checked:before:translate-x-6 before:translate-x-1",
          "before:inline-block before:h-4 before:w-4",
          "before:transform before:transition",
          "before:rounded-full",
          "before:bg-neutral-700 peer-checked:before:bg-neutral-950",

          className
        )}
      />
    </>
  );
});

export { Toggle };
