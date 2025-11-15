import { Dialog } from "radix-ui";
import { PopupDialog } from "./PopupDialog";
import { ActionButton } from "./ActionButton";
import {
  MdOutlineBackup,
  MdOutlineCheck,
  MdOutlinePassword,
  MdOutlineRestore,
  MdLink,
  MdWaterDrop,
  MdOutlineMerge,
} from "react-icons/md";
import toast from "react-hot-toast";
import { cn, createAndDownloadBackup } from "../lib/utils";
import { Link } from "react-router";
import { HiOutlineCurrencyDollar } from "react-icons/hi2";

const ExtraUtilsDialog = () => {
  /* Handle Backup Action */
  const backup = () => {
    toast.promise(createAndDownloadBackup(), {
      loading: "Creating backup...",
      success: "Backup created and download initiated.",
      error: "Failed to create backup.",
    });
  };

  return (
    <PopupDialog>
      <Dialog.Title
        className={cn(
          "text-2xl text-center text-yellow-400 grow min-w-0",
          "font-protest-guerrilla"
        )}
      >
        Extra Tools
      </Dialog.Title>
      {/* Utilities Description */}
      <Dialog.Description className="sr-only">
        Additional utilities and tools you can use.
      </Dialog.Description>

      {/* Utilities Content */}
      <div className="flex flex-wrap justify-center items-center gap-6">
        {/* Merge */}
        <ActionButton
          asChild
          title="Merge Accounts"
          label="Merge"
          icon={<MdOutlineMerge className="size-5" />}
        >
          <Link to="/merge" />
        </ActionButton>

        {/* Backup */}
        <ActionButton
          label="Backup"
          title="Create a backup"
          icon={<MdOutlineBackup className="size-5" />}
          onClick={backup}
        />

        {/* Restore */}
        <ActionButton
          asChild
          label="Restore"
          title="Restore a backup"
          icon={<MdOutlineRestore className="size-5" />}
        >
          <Link to="/restore" />
        </ActionButton>

        {/* Password Change */}
        <ActionButton
          asChild
          title="Change your password"
          label="Password"
          icon={<MdOutlinePassword className="size-5" />}
        >
          <Link to="/password" />
        </ActionButton>

        {/* Update URLs */}
        <ActionButton
          asChild
          title="Update Account URLs"
          label="URLs"
          icon={<MdLink className="size-5" />}
        >
          <Link to="/update-urls" />
        </ActionButton>

        {/* Pack */}
        <ActionButton
          asChild
          title="Pack Accounts"
          label="Pack"
          icon={<HiOutlineCurrencyDollar className="size-5" />}
        >
          <Link to="/pack" />
        </ActionButton>

        {/* Validate */}
        <ActionButton
          asChild
          title="Validate Accounts"
          label="Validate"
          icon={<MdOutlineCheck className="size-5" />}
        >
          <Link to="/validate" />
        </ActionButton>

        {/* Refill */}
        <ActionButton
          asChild
          title="Refill Accounts"
          label="Refill"
          icon={<MdWaterDrop className="size-5" />}
        >
          <Link to="/refill" />
        </ActionButton>
      </div>
    </PopupDialog>
  );
};

export { ExtraUtilsDialog };
