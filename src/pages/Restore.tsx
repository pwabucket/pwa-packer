import { useCallback } from "react";
import { InnerPageLayout } from "../layouts/InnerPageLayout";
import {
  useDropzone,
  type DropzoneRootProps,
  type DropzoneInputProps,
} from "react-dropzone";
import { toast } from "react-hot-toast";
import type { BackupData } from "../types";
import { cn, restoreBackupData } from "../lib/utils";
import { useNavigate } from "react-router";
import BackupIcon from "../assets/backup.svg";
import {
  MdOutlineBackup,
  MdOutlineDownload,
  MdOutlineWarning,
} from "react-icons/md";

/* Warning Icon Component */
const WarningIcon = () => (
  <MdOutlineWarning className="size-5 shrink-0 text-yellow-500" />
);

/* Upload Icon Component */
const UploadIcon = ({ isDragActive }: { isDragActive: boolean }) => (
  <MdOutlineBackup
    className={cn(
      "size-8 transition-all duration-300",
      isDragActive && "scale-110"
    )}
  />
);

/* File Type Indicator Component */
const FileTypeIndicator = () => (
  <div className="flex items-center justify-center gap-2">
    <div className="flex items-center gap-1 text-xs text-blue-300">
      <MdOutlineDownload className="size-4" />
      <span>.json files only</span>
    </div>
  </div>
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

/* Upload Text Content Component */
const UploadTextContent = ({ isDragActive }: { isDragActive: boolean }) => (
  <div className="flex flex-col gap-1">
    {isDragActive ? (
      <div className="flex flex-col gap-1">
        <p className="text-yellow-400 font-semibold text-lg animate-pulse">
          Drop your backup file here
        </p>
        <p className="text-yellow-500 text-sm">Release to restore</p>
      </div>
    ) : (
      <div className="flex flex-col gap-1">
        <p className="text-yellow-400 font-semibold text-base">
          Upload Backup File
        </p>
        <p className="text-yellow-500 text-sm leading-relaxed">
          Drag and drop your backup file here
        </p>
        <div>
          <span className="inline-flex items-center px-3 py-2 rounded-full text-xs font-medium text-yellow-500 border border-yellow-500">
            or click to browse
          </span>
        </div>
      </div>
    )}
  </div>
);

/* Drag Zone Component */
interface DragZoneProps {
  getRootProps: () => DropzoneRootProps;
  getInputProps: () => DropzoneInputProps;
  isDragActive: boolean;
}

const DragZone = ({
  getRootProps,
  getInputProps,
  isDragActive,
}: DragZoneProps) => (
  <div
    {...getRootProps()}
    className={cn(
      "group border-2 border-dashed border-yellow-500",
      "px-6 py-12 text-center rounded-2xl",
      "flex flex-col gap-4 items-center justify-center",
      "transition-all duration-300 ease-in-out",
      "cursor-pointer hover:border-yellow-400 ",
      "hover:scale-[1.02]",
      isDragActive && "border-yellow-400 scale-[1.02]"
    )}
  >
    <input {...getInputProps()} />

    {/* Upload icon */}
    <div
      className={cn(
        "mx-auto size-16 rounded-full bg-yellow-500 text-black",
        "flex items-center justify-center transition-transform duration-300",
        "group-hover:scale-110",
        isDragActive && "scale-110"
      )}
    >
      <UploadIcon isDragActive={isDragActive} />
    </div>

    <UploadTextContent isDragActive={isDragActive} />
    <FileTypeIndicator />
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
      <img src={BackupIcon} alt="Restore Backup" className="size-28 mx-auto" />
      <WarningSection />
      <DragZone
        getRootProps={getRootProps}
        getInputProps={getInputProps}
        isDragActive={isDragActive}
      />
    </InnerPageLayout>
  );
};

export { Restore };
