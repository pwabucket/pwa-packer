interface ProgressProps {
  current: number;
  max: number;
}

const Progress = ({ current, max }: ProgressProps) => {
  return (
    <div className="w-full h-2 overflow-hidden bg-neutral-800 border border-neutral-700">
      <div
        className="bg-yellow-500 h-full transition-all duration-500"
        style={{ width: `${(current / max) * 100}%` }}
      ></div>
    </div>
  );
};

export { Progress };
