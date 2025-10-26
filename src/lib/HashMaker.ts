import { ethers } from "ethers";

/** Network Configuration */
const IS_MAINNET = import.meta.env.PROD;
const RPC = IS_MAINNET
  ? "https://bsc-dataseed.binance.org/"
  : "https://data-seed-prebsc-1-s1.binance.org:8545/";

/** USDT Contract Configuration */
const USDT_DECIMALS = 18;
const USDT_CONTRACT_ADDRESS = IS_MAINNET
  ? "0x55d398326f99059ff775485246999027b3197955"
  : "0x337610d27c682e347c9cd60bd4b3b107c9d34ddd";

const USDT_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
];

/** Gas Price & Limits */
const MINOR_GAS_INCREMENT = ethers.parseUnits("0.001", "gwei");
const BASE_GAS_PRICE = ethers.parseUnits("0.13", "gwei");
const GAS_LIMIT_NATIVE = 21_000n;
const GAS_LIMITS_TRANSFER = {
  average: 50_000n,
  fast: 65_000n,
  instant: 75_000n,
};

/** Hash Result Interface */
export interface HashResult {
  signedRawTx: string;
  txHash: string;
  nonce: number;
  initialNonce: number;
  gasPrice: bigint;
  amount: string;
  attempts: number;
  wallet?: ethers.HDNodeWallet;
}

class HashMaker {
  provider: ethers.JsonRpcProvider;
  wallet: ethers.Wallet;
  address: ethers.AddressLike | undefined;

  constructor({
    privateKey,
    provider = null,
  }: {
    privateKey: string;
    provider?: ethers.JsonRpcProvider | null;
  }) {
    this.provider = provider || HashMaker.createProvider();
    this.wallet = new ethers.Wallet(privateKey, this.provider);
  }

  /** @method createProvider */
  static createProvider() {
    return new ethers.JsonRpcProvider(RPC);
  }

  async initialize() {
    this.address = await this.wallet.getAddress();
    console.log("Using address:", this.address);
  }

  /**
   * @method _buildTokenCallData
   * Builds the encoded data payload for the USDT transfer call.
   */
  private _buildTokenCallData(receiver: string, amount: string): string {
    const parsedAmount = ethers.parseUnits(amount, USDT_DECIMALS);
    const iface = new ethers.Interface(USDT_ABI);
    const data = iface.encodeFunctionData("transfer", [receiver, parsedAmount]);

    return data;
  }

  /**
   * @method _findMatchingWallet
   * Finds a wallet that produces a specific hash suffix.
   * @param param0 - The parameters for the search.
   * @returns The matching wallet and transaction details.
   */
  private async _findMatchingWallet({
    baseTx,
    targetCharacter,
    gasPrice,
    amount,
  }: {
    baseTx: object;
    targetCharacter: string;
    gasPrice: bigint;
    amount: string;
  }): Promise<HashResult> {
    let attempts = 0;

    while (true) {
      /** Generate random wallet */
      const randomWallet = ethers.Wallet.createRandom(this.provider);

      console.log("Address:", randomWallet.address);
      console.log("PrivateKey:", randomWallet.privateKey);

      /** Prepare transaction with nonce 0 */
      const tx = { ...baseTx, nonce: 0 };
      const signed = await randomWallet.signTransaction(tx);
      const txHash = ethers.keccak256(signed);
      const actualSuffix = txHash.slice(-1).toLowerCase();

      attempts++;

      if (targetCharacter === actualSuffix) {
        console.log(`\n✅ Found matching wallet after ${attempts} attempts!`);
        console.log("Target Suffix:", actualSuffix);
        console.log("Wallet Address:", randomWallet.address);
        console.log("Target Hash:", txHash);

        return {
          wallet: randomWallet,
          signedRawTx: signed,
          txHash,
          nonce: 0,
          initialNonce: 0,
          gasPrice,
          amount,
          attempts,
        };
      }

      /** Progress reporting */
      console.log(`\rAttempts: ${attempts}, last suffix: ${actualSuffix}`);
    }
  }

  /**
   * @method _findMatchingHash
   * Loops through nonces, signs transactions, and checks hash suffix until a match is found.
   */
  private async _findMatchingHash({
    targetCharacter,
    baseTx,
    initialNonce,
    gasPrice,
    amount,
  }: {
    targetCharacter: string;
    baseTx: object;
    initialNonce: number;
    gasPrice: bigint;
    amount: string;
  }): Promise<HashResult> {
    let nonce = initialNonce;
    let attempts = 0;

    while (true) {
      const tx = { ...baseTx, nonce };
      const signed = await this.wallet.signTransaction(tx);
      const txHash = ethers.keccak256(signed);
      const actualSuffix = txHash.slice(-1).toLowerCase();

      attempts++;

      if (targetCharacter === actualSuffix) {
        console.log(`\n✅ Found match after ${attempts} attempts!`);
        console.log("Target Suffix:", actualSuffix);
        console.log("Target Nonce:", nonce);
        console.log("Target Hash:", txHash);

        return {
          signedRawTx: signed,
          txHash,
          nonce,
          initialNonce,
          gasPrice,
          amount,
          attempts,
        };
      }

      /** Progress reporting */
      console.log(`\rAttempts: ${attempts}, last suffix: ${actualSuffix}`);

      /** Increment nonce for next attempt */
      nonce++;
    }
  }

  /**
   * @method _isAlreadyKnownError
   * Checks if the error is an 'already known' transaction error.
   */
  protected _isAlreadyKnownError(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "error" in error &&
      (error as { error: { code: number } }).error.code === -32000
    );
  }

  /**
   * @method _castAlreadyKnownError
   * Casts an 'already known' error into a TransactionResponse object.
   */
  protected _castAlreadyKnownError(hash: string): ethers.TransactionResponse {
    return {
      hash,
      wait: async () => this.provider.waitForTransaction(hash),
    } as unknown as ethers.TransactionResponse; /** Cast to satisfy type system */
  }

  /**
   * @method _broadcastTransaction
   * Handles the transaction broadcast, including error coalescing for 'already known'.
   */
  private async _broadcastTransaction(
    signed: string,
    txHash: string,
    nonce: number
  ): Promise<ethers.TransactionResponse> {
    let sent: ethers.TransactionResponse;

    try {
      sent = await this.provider.broadcastTransaction(signed);
    } catch (error) {
      if (this._isAlreadyKnownError(error)) {
        /** Log and proceed to monitor the existing transaction */
        console.log(
          `⚠️ Transaction with nonce ${nonce} is already known by the node. Monitoring existing transaction...`
        );

        /** Coalesce the error into a response object to proceed to .wait() */
        sent = this._castAlreadyKnownError(txHash);
      } else {
        throw error;
      }
    }

    return sent;
  }

  /**
   * @method _transferUSDT
   * Transfers USDT tokens to a specified address.
   */
  private async _transferUSDT({
    to,
    amount,
    nonce,
    chainId,
  }: {
    to: string;
    amount: string;
    nonce: number;
    chainId: bigint;
  }) {
    if (!this.address) {
      throw new Error("Wallet address is not initialized.");
    }

    const data = this._buildTokenCallData(to, amount);
    const txGasPrice = BASE_GAS_PRICE;
    const txGasLimit = GAS_LIMITS_TRANSFER["fast"];

    const tx = {
      to: USDT_CONTRACT_ADDRESS,
      value: 0n,
      data,
      gasLimit: txGasLimit,
      gasPrice: txGasPrice,
      chainId,
      nonce,
    };

    const signedTx = await this.wallet.signTransaction(tx);
    const txResponse = await this.provider.broadcastTransaction(signedTx);

    await txResponse.wait();
  }

  /**
   * @method _transferBNB
   * Transfers BNB to a specified address.
   */
  private async _transferBNB({
    to,
    amount,
    nonce,
    chainId,
  }: {
    to: string;
    amount: bigint;
    nonce: number;
    chainId: bigint;
  }) {
    if (!this.address) {
      throw new Error("Wallet address is not initialized.");
    }

    const txGasPrice = BASE_GAS_PRICE;
    const txGasLimit = GAS_LIMIT_NATIVE;

    const tx = {
      to,
      value: amount,
      gasLimit: txGasLimit,
      gasPrice: txGasPrice,
      chainId,
      nonce,
    };
    const signedTx = await this.wallet.signTransaction(tx);
    const txResponse = await this.provider.broadcastTransaction(signedTx);

    await txResponse.wait();
  }

  /**
   * Funds a wallet with USDT and BNB.
   * @param param0 - The funding parameters.
   */
  private async _fundWallet({
    wallet,
    amount,
  }: {
    wallet: ethers.HDNodeWallet;
    amount: string;
  }) {
    if (!this.address) {
      throw new Error("Wallet address is not initialized.");
    }

    /** Get network chain ID */
    const { chainId } = await this.provider.getNetwork();

    /** Get current nonce */
    let currentNonce = await this.provider.getTransactionCount(
      this.address,
      "pending"
    );

    /** Fund wallet with USDT */
    console.log(
      `\n--- Funding Wallet ${wallet.address} with ${amount} USDT ---`
    );
    await this._transferUSDT({
      to: wallet.address,
      amount,
      nonce: currentNonce,
      chainId,
    });

    /** Log funding completion */
    console.log(`✅ Funded wallet ${wallet.address} with ${amount} USDT.`);

    /** Increment nonce after USDT transfer */
    currentNonce++;

    /** Fund wallet with BNB for gas */
    const totalBNB = GAS_LIMITS_TRANSFER["instant"] * BASE_GAS_PRICE;
    const totalBNBInEther = ethers.formatEther(totalBNB);

    console.log(
      `\n--- Funding Wallet ${wallet.address} with ${totalBNBInEther} BNB for gas ---`
    );
    await this._transferBNB({
      to: wallet.address,
      amount: totalBNB,
      nonce: currentNonce,
      chainId,
    });

    /** Log funding completion */
    console.log(
      `✅ Funded wallet ${wallet.address} with ${amount} USDT and ${totalBNBInEther} BNB for gas.`
    );
  }

  /**
   * Refunds the wallet's BNB balance back to the main wallet.
   * @param param0 - The refund parameters.
   */
  private async _refundWallet({ wallet }: { wallet: ethers.HDNodeWallet }) {
    if (!this.address) {
      throw new Error("Wallet address is not initialized.");
    }

    /** Check wallet balance */
    const walletBalance = await this.provider.getBalance(wallet.address);

    /* If balance is zero, skip refund */
    if (walletBalance === 0n) {
      console.log(
        `Wallet ${wallet.address} has zero balance. No refund needed.`
      );
      return;
    }

    /** Log refund initiation */
    console.log(
      `\n--- Refunding Wallet ${wallet.address} balance of ${ethers.formatEther(
        walletBalance
      )} BNB back to main wallet ---`
    );

    /** Prepare and send refund transaction */
    const nonce = await this.provider.getTransactionCount(
      wallet.address,
      "pending"
    );

    const gasPrice = BASE_GAS_PRICE;
    const gasLimit = GAS_LIMIT_NATIVE;
    const totalGasCost = gasPrice * gasLimit;

    /** Check if wallet balance covers gas costs */
    if (walletBalance <= totalGasCost) {
      console.log(
        `Wallet ${wallet.address} balance is insufficient to cover gas costs. Skipping refund.`
      );
      return;
    }

    /** Calculate refund amount after gas */
    const refundAmount = walletBalance - totalGasCost;

    const { chainId } = await this.provider.getNetwork();
    const tx = {
      to: this.address,
      value: refundAmount,
      gasLimit,
      gasPrice,
      chainId,
      nonce,
    };

    const signedTx = await wallet.signTransaction(tx);
    const txResponse = await this.provider.broadcastTransaction(signedTx);

    await txResponse.wait();

    /** Log refund completion */
    console.log(
      `✅ Refunded wallet ${wallet.address}. Tx Hash: ${txResponse.hash}`
    );
  }

  /**
   * @method submitFillerTransactions
   * Submits 0-value BNB transactions for skipped nonces to unblock the target transaction.
   */
  public async submitFillerTransactions({
    startNonce,
    endNonce,
    baseGasPrice,
    waitForReceipt = false,
  }: {
    startNonce: number;
    endNonce: number;
    baseGasPrice: bigint;
    waitForReceipt?: boolean;
  }) {
    if (!this.address) {
      throw new Error("Wallet address is not initialized.");
    }
    const { chainId } = await this.provider.getNetwork();

    /** Log filler submission start */
    console.log(
      `\n--- Submitting Nonce Filler Transactions for ${startNonce} to ${
        endNonce - 1
      } ---`
    );

    for (let nonce = startNonce; nonce < endNonce; nonce++) {
      /** Increase gas price slightly for each filler to help maintain order and priority */
      const increment = BigInt(nonce - startNonce);
      const fillerGasPrice =
        baseGasPrice + increment * MINOR_GAS_INCREMENT; /** Add N Gwei */
      const fillerGasLimit = GAS_LIMIT_NATIVE;

      const fillerTx = {
        to: this.address,
        value: 0n,
        nonce: nonce,
        gasLimit: fillerGasLimit,
        gasPrice: fillerGasPrice,
        chainId,
      };

      try {
        const signedFillerTx = await this.wallet.signTransaction(fillerTx);
        const txResponse = await this.provider.broadcastTransaction(
          signedFillerTx
        );

        /** Log filler transaction submission */
        console.log(
          `  Filler Tx Nonce ${nonce} submitted. Hash: ${txResponse.hash.slice(
            0,
            10
          )}...`
        );

        /** Optionally wait for the transaction to be mined */
        if (waitForReceipt) {
          await txResponse.wait();
          console.log(`  ✅ Filler Tx Nonce ${nonce} mined.`);
        }
      } catch (error) {
        if (this._isAlreadyKnownError(error)) {
          console.log(
            `Filler Tx Nonce ${nonce} already known/mined. Skipping.`
          );
        } else {
          console.error(`Error submitting filler for nonce ${nonce}:`, error);
          throw error;
        }
      }
    }
    console.log("--- Filler Submissions Complete ---");
  }

  /**
   * @method generateTransaction
   * Main method to find a matching hash, submit fillers, and broadcast the target transaction.
   */
  public async generateTransaction({
    targetCharacter,
    receiver,
    amount,
    gasLimit,
    freshWallet = true,
    broadcastIfFound = false,
  }: {
    targetCharacter: string;
    receiver: string;
    amount: string;
    gasLimit: keyof typeof GAS_LIMITS_TRANSFER;
    freshWallet?: boolean;
    broadcastIfFound?: boolean;
  }) {
    if (!this.address) {
      throw new Error("Wallet address is not initialized.");
    }

    const data = this._buildTokenCallData(receiver, amount);
    const { chainId } = await this.provider.getNetwork();

    const txGasPrice = BASE_GAS_PRICE;
    const txGasLimit = GAS_LIMITS_TRANSFER[gasLimit];

    const baseTx = {
      to: USDT_CONTRACT_ADDRESS,
      value: 0n,
      data,
      gasLimit: txGasLimit,
      gasPrice: txGasPrice,
      chainId,
    };

    let hashResult: HashResult;

    if (freshWallet) {
      hashResult = await this._findMatchingWallet({
        amount,
        targetCharacter,
        baseTx,
        gasPrice: txGasPrice,
      });
    } else {
      const initialNonce = await this.provider.getTransactionCount(
        this.address,
        "pending"
      );

      hashResult = await this._findMatchingHash({
        amount,
        targetCharacter,
        baseTx,
        gasPrice: txGasPrice,
        initialNonce,
      });
    }

    /** If not broadcasting, return the found hash result */
    if (!broadcastIfFound) {
      console.log("Not broadcasting (broadcastIfFound=false).");
      return hashResult;
    }

    /** Broadcast the found transaction */
    return this.submitTransferTransaction(hashResult);
  }

  /**
   * @method submitTransferTransaction
   * Submits the transfer transaction, handling nonce fillers and wallet funding/refunding as needed.
   */
  async submitTransferTransaction({
    nonce,
    initialNonce,
    signedRawTx,
    txHash,
    gasPrice,
    amount,
    wallet,
  }: HashResult) {
    /** Submit nonce fillers if needed */
    if (nonce > initialNonce) {
      /** Log filler submission start */
      console.log(
        `\n⚠️ ${nonce - initialNonce} nonces skipped. Submitting fillers now...`
      );

      /** Submit filler transactions for skipped nonces */
      await this.submitFillerTransactions({
        startNonce: initialNonce,
        endNonce: nonce,
        baseGasPrice: gasPrice,
      });
    }

    /** Fund the wallet if using a fresh wallet */
    if (wallet) {
      await this._fundWallet({ wallet, amount });
    }

    /** Broadcast the target transaction */
    console.log(`\n--- Broadcasting TARGET Transaction (Nonce ${nonce}) ---`);
    const sent = await this._broadcastTransaction(signedRawTx, txHash, nonce);
    console.log(`\n✅ Target Transaction Broadcasted. Hash: ${sent.hash}`);

    /** Wait for transaction to be mined */
    const receipt = await sent.wait();
    console.log("✅ Transaction mined. Receipt:", receipt);

    /** Refund the wallet if using a fresh wallet */
    if (wallet) {
      await this._refundWallet({ wallet });
    }

    return { receipt, signedRawTx, txHash };
  }
}

export default HashMaker;
