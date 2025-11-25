import { cn, copyToClipboard } from "../lib/utils";
import { MdOutlineCopyAll, MdOutlineOpenInNew } from "react-icons/md";

/** Item Information Props */
interface ItemInfoProps {
  title: string;
  value: string;
  icon?: React.ReactNode;
  containerClassName?: string;
  valueClassName?: string;
  rightContent?: React.ReactNode;
  href?: string;
  canCopy?: boolean;
}

/** Item Information Component */
const ItemInfo = ({
  title,
  value,
  icon,
  containerClassName,
  valueClassName,
  rightContent,
  href,
  canCopy = true,
}: ItemInfoProps) => (
  <div
    className={cn(
      "flex gap-4 p-4 bg-neutral-800 rounded-xl font-mono",
      containerClassName
    )}
  >
    {/* Icon */}
    <span className="shrink-0">{icon}</span>

    {/* Title & Value */}
    <div className="flex flex-col gap-1 grow min-w-0 min-h-0">
      {/* Title */}
      <h2 className="text-neutral-400 font-bold text-xs uppercase">{title}</h2>

      {/* Value */}
      <p className={cn("font-bold wrap-break-word text-sm", valueClassName)}>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
          >
            {value}{" "}
            <MdOutlineOpenInNew className="inline-block size-3 opacity-30" />
          </a>
        ) : (
          value
        )}
      </p>
    </div>

    {/* Copy Button */}
    {canCopy && (
      <button
        className={cn(
          "text-xs text-neutral-500 hover:text-yellow-500",
          "transition-colors cursor-pointer shrink-0"
        )}
        onClick={() => copyToClipboard(value.toString())}
      >
        <MdOutlineCopyAll className="size-5" />
      </button>
    )}

    {/* Right Content */}
    {rightContent && <div className="shrink-0">{rightContent}</div>}
  </div>
);

export { ItemInfo };
export type { ItemInfoProps };
