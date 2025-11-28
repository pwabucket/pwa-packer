import {
  type DropzoneRootProps,
  type DropzoneInputProps,
} from "react-dropzone";
import { cn } from "../lib/utils";
import { MdOutlineBackup, MdOutlineDownload } from "react-icons/md";

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

/* Upload Text Content Component */
const UploadTextContent = ({ isDragActive }: { isDragActive: boolean }) => (
  <div className="flex flex-col gap-1">
    {isDragActive ? (
      <div className="flex flex-col gap-1">
        <p className="text-yellow-400 font-semibold text-lg animate-pulse">
          Drop your file here
        </p>
        <p className="text-yellow-500 text-sm">Release to upload</p>
      </div>
    ) : (
      <div className="flex flex-col gap-1">
        <p className="text-yellow-400 font-semibold text-base">Upload File</p>
        <p className="text-yellow-500 text-sm leading-relaxed">
          Drag and drop your file here
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

export { DragZone };
