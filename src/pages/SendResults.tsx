import type { SendResult } from "../types";
import { PopupDialog } from "../components/PopupDialog";
import { Accordion, Dialog } from "radix-ui";
import { Button } from "../components/Button";
import { AccountAddresses } from "../components/AccountAddresses";
import { HiCheckCircle, HiXCircle } from "react-icons/hi2";
import { cn } from "../lib/utils";
import { AccountBalance } from "../components/AccountBalance";

interface ResultInfoProps {
  title: React.ReactNode;
  value: React.ReactNode;
  icon?: React.ReactNode;
  valueClassName?: string;
}

/** Result Information Component */
const ResultInfo = ({
  title,
  value,
  icon,
  valueClassName,
}: ResultInfoProps) => (
  <div className="flex gap-4 p-4 bg-neutral-700 rounded-xl font-mono">
    {/* Icon */}
    <span className="shrink-0">{icon}</span>

    {/* Title & Value */}
    <div className="flex flex-col gap-1 grow min-w-0 min-h-0">
      {/* Title */}
      <h2 className="text-neutral-400 font-bold text-xs uppercase">{title}</h2>

      {/* Value */}
      <p className={cn("font-bold wrap-break-word text-sm", valueClassName)}>
        {value}
      </p>
    </div>
  </div>
);

/** Send Results Props Interface */
interface SendResultsProps {
  results: SendResult[];
}

/** Send Results Component */
const SendResults = ({ results }: SendResultsProps) => {
  return (
    <PopupDialog onInteractOutside={(e) => e.preventDefault()}>
      <Dialog.Title className="text-2xl text-center text-yellow-500">
        Results
      </Dialog.Title>
      <Dialog.Description className="text-center text-sm text-neutral-400">
        Summary of send operations:
      </Dialog.Description>

      <Accordion.Root type="single" className="flex flex-col gap-2">
        {results.map((res) => (
          <Accordion.Item
            value={res.account.id}
            key={res.account.id}
            className={cn(
              "flex flex-col",
              "text-sm bg-neutral-800 rounded-2xl",
              "border border-transparent",
              "hover:border-yellow-500 transition-border"
            )}
          >
            <Accordion.Header>
              <Accordion.Trigger className="w-full text-left p-4 flex gap-2 items-center cursor-pointer">
                {res.status ? (
                  <HiCheckCircle className="size-4 text-green-500 shrink-0" />
                ) : (
                  <HiXCircle className="size-4 text-red-500 shrink-0" />
                )}

                {/* Title */}
                <div className="flex flex-col grow min-w-0">
                  <span className="text-xs font-bold text-yellow-500 truncate">
                    {res.account.title}
                  </span>
                  <AccountBalance account={res.account} />
                </div>

                {/* Addresses */}
                <AccountAddresses account={res.account} />
              </Accordion.Trigger>
            </Accordion.Header>

            <Accordion.Content className="flex flex-col gap-2 p-4 pt-0">
              {/* Receiver */}
              <ResultInfo
                title="Receiver"
                value={res.receiver}
                icon={<span>🏦</span>}
                valueClassName="text-orange-300"
              />

              {/* Target Character */}
              <ResultInfo
                title="Target Character"
                value={res.targetCharacter}
                icon={<span>🔠</span>}
                valueClassName="text-blue-300"
              />

              {/* Transaction Hash */}
              <ResultInfo
                title="Transaction Hash"
                value={res.hashResult?.txHash || ""}
                icon={<span>🔗</span>}
                valueClassName="text-lime-300"
              />

              {/* Wallet Address */}
              <ResultInfo
                title="Wallet Address"
                value={res.hashResult?.wallet?.address || ""}
                icon={<span>💼</span>}
                valueClassName="text-cyan-300"
              />

              {/* Private Key */}
              <ResultInfo
                title="Wallet Private Key"
                value={res.hashResult?.wallet?.privateKey || ""}
                icon={<span>🔑</span>}
                valueClassName="text-red-300"
              />

              {/* Wallet Phrase */}
              <ResultInfo
                title="Wallet Phrase"
                value={res.hashResult?.wallet?.mnemonic?.phrase || ""}
                icon={<span>🗣️</span>}
                valueClassName="text-pink-300"
              />
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>

      {/* Close Button */}
      <Dialog.Close asChild>
        <Button className="my-2">Close</Button>
      </Dialog.Close>
    </PopupDialog>
  );
};

export { SendResults };
