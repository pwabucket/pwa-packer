import { cn } from "../lib/utils";
import { Slot } from "radix-ui";

/** Action Button Props Interface */
interface ActionButtonProps extends React.ComponentProps<"button"> {
  asChild?: boolean;
  label?: string;
  icon: React.ReactNode;
}

/** Action Button Component */
const ActionButton = ({
  icon,
  label,
  asChild,
  children,
  ...props
}: ActionButtonProps) => {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      {...props}
      className="flex flex-col justify-center items-center shrink-0 gap-1 group"
    >
      <span
        className={cn(
          "size-14 shrink-0 rounded-full",
          "flex items-center justify-center gap-2",
          "border border-neutral-700 cursor-pointer",
          "hover:bg-yellow-500 hover:text-black transition-colors"
        )}
      >
        {icon}
      </span>

      <Slot.Slottable>{children}</Slot.Slottable>

      <span
        className={cn(
          "text-xs shrink-0 text-center transition-colors",
          "text-neutral-400 group-hover:text-yellow-500"
        )}
      >
        {label}
      </span>
    </Comp>
  );
};

export { ActionButton };
