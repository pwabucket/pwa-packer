import { useCallback } from "react";
import { InnerPageLayout } from "../layouts/InnerPageLayout";
import { useDropzone } from "react-dropzone";
import { toast } from "react-hot-toast";
import type { BackupData } from "../types";
import { MdOutlineRestore } from "react-icons/md";
import { restoreBackupData } from "../lib/utils";
import { useNavigate } from "react-router";

const Restore = () => {
  const navigate = useNavigate();
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      const reader = new FileReader();

      reader.addEventListener("load", (e) => {
        try {
          const json = JSON.parse(e.target!.result as string) as BackupData;
          const { data } = json;

          toast.promise(
            restoreBackupData(data).then(() =>
              navigate("/", { replace: true })
            ),
            {
              loading: "Restoring backup...",
              success: "Backup restored!",
              error: "Failed to restore backup.",
            }
          );
        } catch {
          toast.error("Invalid backup file!");
        }
      });
      reader.readAsText(file);
    },
    [navigate]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/json": [".json"],
    },
    maxFiles: 1,
    multiple: false,
  });

  return (
    <InnerPageLayout title="Restore" className="gap-6">
      <MdOutlineRestore className="size-20 text-yellow-500 mx-auto" />

      <div
        {...getRootProps()}
        className="border border-dashed border-yellow-500 px-4 py-10 text-center rounded-xl text-sm text-yellow-500 cursor-pointer hover:bg-yellow-500/10 transition"
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the backup file here ...</p>
        ) : (
          <p>
            Drag 'n' drop the backup file here, or click to select backup file
          </p>
        )}
      </div>
    </InnerPageLayout>
  );
};

export { Restore };
