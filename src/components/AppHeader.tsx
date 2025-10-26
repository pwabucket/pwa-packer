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
    <header className="sticky top-0 bg-neutral-900 px-4 py-1">
      <div className="w-full max-w-sm mx-auto flex items-center gap-4">
        {/* Left Content */}
        <div className="size-10">{leftContent}</div>

        {/* Middle Content */}
        <div className="grow min-w-0 min-h-0 text-center">{middleContent}</div>

        {/* Right Content */}
        <div className="size-10">{rightContent}</div>
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
