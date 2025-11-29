import { useJsonDropzone } from "../hooks/useJsonDropzone";
import { useJSONReader } from "../hooks/useJSONReader";
import type { PlanFileContent } from "../types";
import { DragZone } from "./DragZone";

const PlanImport = ({
  onImport,
}: {
  onImport: (data: PlanFileContent) => void;
}) => {
  /* On drop */
  const onDrop = useJSONReader(onImport);

  /* Dropzone */
  const { getRootProps, getInputProps, isDragActive } = useJsonDropzone(onDrop);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-neutral-400 text-center px-4">
        To continue, please import your previously saved plan file. This file
        contains all the details of your planned account distributions,
        including the total amount, maximum per account, and activity
        statistics. Drag and drop your plan file here, or click to select it
        from your device. Once imported, you will be able to review or execute
        the plan as needed.
      </p>
      <DragZone
        title="plan"
        getRootProps={getRootProps}
        getInputProps={getInputProps}
        isDragActive={isDragActive}
      />
    </div>
  );
};

export { PlanImport };
