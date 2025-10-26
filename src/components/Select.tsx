import { cn } from "../lib/utils";

const Select = (props: React.ComponentProps<"select">) => {
  return (
    <select
      {...props}
      className={cn(
        "px-4 py-2 rounded-full border border-neutral-700",
        "focus:outline-none focus:ring-2 focus:ring-yellow-500",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        props.className
      )}
    />
  );
};

const SelectOption = (props: React.ComponentProps<"option">) => {
  return (
    <option {...props} className={cn("bg-neutral-900", props.className)} />
  );
};

Select.Option = SelectOption;

export { Select };
