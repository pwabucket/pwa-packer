import { useCallback } from "react";
import { toast } from "react-hot-toast";

const useJSONReader = (callback: (data: any) => void) => {
  return useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      const reader = new FileReader();

      reader.addEventListener("load", (e) => {
        try {
          const data = JSON.parse(e.target!.result as string);
          callback(data);
        } catch {
          toast.error("Invalid JSON file!");
        }
      });
      reader.readAsText(file);
    },
    [callback]
  );
};

export { useJSONReader };
