import { Dialog } from "radix-ui";
import { PopupDialog } from "./PopupDialog";
import { ActionButton } from "./ActionButton";
import { MdOutlineBackup, MdOutlineRestore } from "react-icons/md";
import toast from "react-hot-toast";
import { createAndDownloadBackup } from "../lib/utils";
import { Link } from "react-router";

const ExtraUtilsDialog = () => {
  const backup = () => {
    toast.promise(createAndDownloadBackup(), {
      loading: "Creating backup...",
      success: "Backup created and download initiated.",
      error: "Failed to create backup.",
    });
  };

  return (
    <PopupDialog>
      <Dialog.Title className="text-xl font-bold text-center text-yellow-500 grow min-w-0 min-h-0">
        Utilities
      </Dialog.Title>
      {/* Utilities Description */}
      <Dialog.Description className="text-sm text-center text-neutral-400">
        Here you can find additional utilities and tools you can use.
      </Dialog.Description>

      {/* Utilities Content */}
      <div className="flex justify-center items-center gap-6">
        <ActionButton
          label="Backup"
          icon={<MdOutlineBackup className="size-5" />}
          onClick={backup}
        />

        <ActionButton
          label="Restore"
          icon={<MdOutlineRestore className="size-5" />}
          asChild
        >
          <Link to="/restore" />
        </ActionButton>
      </div>
    </PopupDialog>
  );
};

export { ExtraUtilsDialog };
