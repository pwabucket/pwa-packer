import { Progress as ProgressPrimitive } from "radix-ui";

interface ProgressProps {
  current: number;
  max: number;
}

const Progress = ({ current, max }: ProgressProps) => {
  return (
    <div className="flex flex-col w-full gap-1">
      <ProgressPrimitive.Root
        value={current}
        className="w-full h-2 overflow-hidden bg-neutral-800 border border-neutral-700 rounded-full"
      >
        <ProgressPrimitive.Indicator
          className="bg-yellow-500 h-full transition-all duration-500"
          style={{ width: `${(current / max) * 100}%` }}
        />
      </ProgressPrimitive.Root>
      <p className="text-xs text-center text-yellow-500">
        {current} / {max}
      </p>
    </div>
  );
};

export { Progress };
