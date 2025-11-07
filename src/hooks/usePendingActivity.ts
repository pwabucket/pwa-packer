import { useEffect } from "react";
import { useAppStore } from "../store/useAppStore";

const usePendingActivity = (status = false) => {
  const setIsProcessing = useAppStore((state) => state.setIsProcessing);

  useEffect(() => {
    if (status !== useAppStore.getState().isProcessing) {
      setIsProcessing(status);
    }

    return () => {
      if (useAppStore.getState().isProcessing) {
        setIsProcessing(false);
      }
    };
  }, [status, setIsProcessing]);
};

export { usePendingActivity };
