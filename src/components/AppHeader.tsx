import { cn } from "../lib/utils";

interface AppHeaderProps {
  leftContent?: React.ReactNode;
  middleContent?: React.ReactNode;
  rightContent?: React.ReactNode;
}

const AppHeader = ({
  leftContent,
  middleContent,
  rightContent,
}: AppHeaderProps) => {
  return (
    <header
      className={cn(
        "sticky top-0 px-4 z-20 h-12",
        "flex items-center justify-center",
        "bg-neutral-900 border-b border-neutral-700"
      )}
    >
      <div className="w-full max-w-sm mx-auto flex items-center gap-4">
        {/* Left Content */}
        <div className="size-10 shrink-0">{leftContent}</div>

        {/* Middle Content */}
        <div className="grow min-w-0 min-h-0 text-center">{middleContent}</div>

        {/* Right Content */}
        <div className="size-10 shrink-0">{rightContent}</div>
      </div>
    </header>
  );
};

const AppHeaderButton = (props: React.ComponentProps<"button">) => {
  return (
    <button
      {...props}
      className={cn(
        "size-full cursor-pointer hover:bg-neutral-800",
        "flex items-center justify-center rounded-full"
      )}
    />
  );
};

AppHeader.Button = AppHeaderButton;

export { AppHeader };
