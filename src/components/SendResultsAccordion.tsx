import type { SendResult } from "../types";
import { Accordion } from "radix-ui";
import { AccountAddresses } from "./AccountAddresses";
import { HiCheckCircle, HiXCircle } from "react-icons/hi2";
import { cn } from "../lib/utils";
import { AccountBalance } from "./AccountBalance";
import { ItemInfo, type ItemInfoProps } from "./ItemInfo";

/** Result Information Component */
const ResultInfo = (props: ItemInfoProps) => (
  <ItemInfo {...props} containerClassName="bg-neutral-700/50" />
);

/** Send Results Props Interface */
interface SendResultsAccordionProps {
  results: SendResult[];
}

const SendResultsAccordion = ({ results }: SendResultsAccordionProps) => (
  <Accordion.Root collapsible type="single" className="flex flex-col gap-2">
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
);

export { SendResultsAccordion };
