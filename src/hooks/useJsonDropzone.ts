import { useDropzone, type DropzoneOptions } from "react-dropzone";

const useJsonDropzone = (onDrop: DropzoneOptions["onDrop"]) =>
  useDropzone({
    onDrop,
    accept: {
      "application/json": [".json"],
    },
    maxFiles: 1,
    multiple: false,
  });

export { useJsonDropzone };
