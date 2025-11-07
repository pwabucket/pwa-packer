import { cn } from "../lib/utils";

const MainContainer = ({
  children,
  className,
  wrapperClassName,
}: {
  children: React.ReactNode;
  className?: string;
  wrapperClassName?: string;
}) => {
  return (
    <main
      className={cn("flex flex-col p-4 grow min-w-0 min-h-0", wrapperClassName)}
    >
      <div
        className={cn(
          "w-full max-w-sm mx-auto flex flex-col grow min-w-0 min-h-0",
          className
        )}
      >
        {children}
      </div>
    </main>
  );
};

export { MainContainer };
