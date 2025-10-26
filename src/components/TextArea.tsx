import { cn } from "../lib/utils";

const TextArea = (props: React.ComponentProps<"textarea">) => {
  return (
    <textarea
      {...props}
      className={cn(
        "px-4 py-2 rounded-lg border border-neutral-700",
        "focus:outline-none focus:ring-2 focus:ring-yellow-500",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        props.className
      )}
    />
  );
};

export { TextArea };
