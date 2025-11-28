import { useCallback } from "react";
import { InnerPageLayout } from "../layouts/InnerPageLayout";
import { toast } from "react-hot-toast";
import type { BackupData } from "../types";
import { restoreBackupData } from "../lib/utils";
import { useNavigate } from "react-router";
import BackupIcon from "../assets/backup.svg";
import { MdOutlineWarning } from "react-icons/md";
import { DragZone } from "../components/DragZone";
import { useJsonDropzone } from "../hooks/useJsonDropzone";

/* Warning Icon Component */
const WarningIcon = () => (
  <MdOutlineWarning className="size-5 shrink-0 text-yellow-500" />
);

/* Warning Section Component */
const WarningSection = () => (
  <div className="relative p-5 bg-neutral-900 rounded-2xl shadow-lg">
    <div className="flex items-start gap-3">
      <WarningIcon />

      <div className="flex-1">
        <h3 className="font-bold text-sm mb-1">Important Warning</h3>
        <p className="text-sm leading-relaxed opacity-90">
          Restoring a backup will completely overwrite your current data. Please
          ensure you have backed up your current data before proceeding with the
          restore operation.
        </p>
      </div>
    </div>
  </div>
);

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

  const { getRootProps, getInputProps, isDragActive } = useJsonDropzone(onDrop);

  return (
    <InnerPageLayout title="Restore" className="gap-6">
      <img src={BackupIcon} alt="Restore Backup" className="size-28 mx-auto" />
      <WarningSection />
      <DragZone
        title="backup"
        getRootProps={getRootProps}
        getInputProps={getInputProps}
        isDragActive={isDragActive}
      />
    </InnerPageLayout>
  );
};

export { Restore };
