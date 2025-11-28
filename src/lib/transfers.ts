import { ethers } from "ethers";
import type { Account } from "../types";
import {
  chunkArrayGenerator,
  delayForSeconds,
  getPrivateKey,
  truncateDecimals,
} from "./utils";
import { WalletReader, type UsdtTokenContract } from "./WalletReader";
import {
  BASE_GAS_PRICE,
  GAS_LIMITS_TRANSFER,
  USDT_DECIMALS,
} from "./transaction";

interface UsdtTransferTransaction {
  from: Account;
  to: Account;
  amount: number;
}

export async function executeUsdtTransfers({
  transactions,
  password,
  onResult,
}: {
  transactions: UsdtTransferTransaction[];
  password: string;
  onResult: (result: {
    sender: Account;
    success: number;
    failed: number;
  }) => void;
}) {
  console.log(`Executing ${transactions.length} transactions...`);

  /* Group transactions by sender to avoid nonce collisions */
  const groupedBySender = new Map<string, typeof transactions>();
  for (const tx of transactions) {
    const senderKey = tx.from.walletAddress;
    if (!groupedBySender.has(senderKey)) {
      groupedBySender.set(senderKey, []);
    }
    groupedBySender.get(senderKey)!.push(tx);
  }

  let success = 0;
  let failed = 0;

  /* Process each sender's transactions sequentially, but senders in parallel (chunks) */
  const senderGroups = Array.from(groupedBySender.values());

  for (const chunk of chunkArrayGenerator(senderGroups, 10)) {
    const results = await Promise.all(
      chunk.map(async (senderTxs) => {
        let senderSuccess = 0;
        let senderFailed = 0;

        /* Execute this sender's transactions sequentially to maintain nonce order */
        for (const tx of senderTxs) {
          try {
            const amountStr = truncateDecimals(tx.amount, 4);
            const reader = new WalletReader(tx.from.walletAddress);
            const provider = reader.getProvider();
            const usdtToken = reader.getUsdtTokenContract();

            const privateKey = await getPrivateKey(tx.from.id, password);
            const wallet = new ethers.Wallet(privateKey, provider);

            console.log(
              `Sending $${amountStr} USDT from ${tx.from.title} (${tx.from.walletAddress}) to ${tx.to.title} (${tx.to.walletAddress})`
            );

            const connectedToken = usdtToken.connect(
              wallet
            ) as UsdtTokenContract;
            const txResult = await connectedToken.transfer(
              tx.to.walletAddress,
              ethers.parseUnits(amountStr, USDT_DECIMALS),
              {
                gasLimit: GAS_LIMITS_TRANSFER["fast"],
                gasPrice: BASE_GAS_PRICE,
              }
            );

            const receipt = await txResult.wait();
            console.log(`Result: ${tx.from.title}`, receipt);

            senderSuccess++;
          } catch (error) {
            console.error(
              `Transfer failed from ${tx.from.title} to ${tx.to.title}:`,
              error
            );
            senderFailed++;
          } finally {
            onResult({
              sender: tx.from,
              success: senderSuccess,
              failed: senderFailed,
            });
          }
        }

        return { success: senderSuccess, failed: senderFailed };
      })
    );

    success += results.reduce((sum, r) => sum + r.success, 0);
    failed += results.reduce((sum, r) => sum + r.failed, 0);

    /* Small delay between chunks */
    if (chunk.length === 10) {
      await delayForSeconds(0.5);
    }
  }

  console.log(
    `Transfer complete: ${success} success, ${failed} failed out of ${transactions.length} total`
  );

  return { success, failed };
}
