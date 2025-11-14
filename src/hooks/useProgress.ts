import { useCallback, useState } from "react";

const useProgress = () => {
  const [target, setTarget] = useState(100);
  const [progress, setProgress] = useState(0);

  const resetProgress = useCallback(() => {
    setProgress(0);
    setTarget(100);
  }, []);
  const incrementProgress = useCallback(
    () => setProgress((prev) => prev + 1),
    []
  );

  return {
    target,
    setTarget,
    progress,
    resetProgress,
    incrementProgress,
  };
};

export { useProgress };
