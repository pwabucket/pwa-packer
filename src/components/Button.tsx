import { cn } from "../lib/utils";

const Button = (props: React.ComponentProps<"button">) => {
  return (
    <button
      {...props}
      className={cn(
        "flex items-center justify-center gap-2",
        "px-4 py-2 rounded-full cursor-pointer",
        "bg-yellow-500 text-black",
        "hover:bg-yellow-400",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        props.className
      )}
    />
  );
};

export { Button };
