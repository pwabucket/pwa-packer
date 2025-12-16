import { Dialog } from "radix-ui";
import useLocationToggle from "../hooks/useLocationToggle";
import { cn } from "../lib/utils";
import { useAppStore } from "../store/useAppStore";
import { LuChevronsUpDown } from "react-icons/lu";
import { MdOutlineClose } from "react-icons/md";
import { PopupDialog } from "./PopupDialog";
import { useMemo } from "react";
import type { Account, ProviderType } from "../types";
import { PROVIDER_NAMES } from "../lib/providers";

interface ProviderOptionProps extends Dialog.DialogCloseProps {
  active: boolean;
  count: number;
}

const ProviderOption = ({ active, count, ...props }: ProviderOptionProps) => (
  <Dialog.Close
    {...props}
    className={cn(
      "w-full px-4 py-2 rounded-xl text-left cursor-pointer",
      "flex items-center justify-center gap-2",
      "font-bold",
      active
        ? "bg-yellow-500 text-black"
        : "bg-neutral-800 hover:bg-neutral-700"
    )}
  >
    <div className="grow">{props.children}</div> ({count})
  </Dialog.Close>
);

const ProvidersDialog = () => {
  const accounts = useAppStore((state) => state.accounts);
  const provider = useAppStore((state) => state.provider);
  const setProvider = useAppStore((state) => state.setProvider);

  const accountsByProvider = useMemo(
    () =>
      accounts.reduce((result, account) => {
        const provider = account.provider || "default";

        if (!result[provider]) {
          result[provider] = [];
        }
        result[provider].push(account);
        return result;
      }, {} as Record<ProviderType, Account[]>),
    [accounts]
  );

  return (
    <PopupDialog>
      <div className="flex items-center gap-4">
        <span className="size-8 shrink-0" />
        <div className="grow min-w-0">
          <Dialog.Title className=" font-bold text-yellow-500 text-center">
            Providers
          </Dialog.Title>
          <Dialog.Description className="text-sm text-neutral-400 text-center">
            Select a provider
          </Dialog.Description>
        </div>
        <Dialog.Close
          className={cn(
            "size-8 shrink-0 flex items-center justify-center",
            "rounded-full hover:bg-neutral-800 hover:text-red-500 cursor-pointer"
          )}
        >
          <MdOutlineClose className="size-6" />
        </Dialog.Close>
      </div>

      <div className="flex flex-col gap-2">
        {Object.entries(PROVIDER_NAMES).map(([key, name]) => (
          <ProviderOption
            key={key}
            active={provider === key}
            count={accountsByProvider[key as ProviderType]?.length || 0}
            onClick={() => setProvider(key as ProviderType)}
          >
            {name}
          </ProviderOption>
        ))}
      </div>
    </PopupDialog>
  );
};

const AppFooter = () => {
  const provider = useAppStore((state) => state.provider);

  const [showProvidersDialog, toggleProvidersDialog] =
    useLocationToggle("providers-dialog");

  return (
    <div className="h-14">
      <div
        className={cn(
          "flex items-center h-14",
          "bg-neutral-950",
          "fixed bottom-0 inset-x-0 z-10"
        )}
      >
        <div className="w-full max-w-sm mx-auto flex items-center justify-center gap-4">
          <Dialog.Root
            open={showProvidersDialog}
            onOpenChange={toggleProvidersDialog}
          >
            <Dialog.Trigger
              className={cn(
                "flex items-center justify-center gap-2",
                "border border-neutral-700 rounded-full",
                "px-4 py-2 text-sm",
                "hover:text-yellow-500",
                "hover:border-yellow-500",
                "cursor-pointer",
                "transition-colors duration-200"
              )}
            >
              {/* Provider Display */}
              <div>{PROVIDER_NAMES[provider]}</div>

              <LuChevronsUpDown className="size-5 text-neutral-400 shrink-0" />
            </Dialog.Trigger>

            <ProvidersDialog />
          </Dialog.Root>
        </div>
      </div>
    </div>
  );
};

export { AppFooter };
