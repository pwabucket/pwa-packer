import {
  BASE_GAS_PRICE,
  DEFAULT_DEADLINE_SECONDS,
  DEFAULT_SLIPPAGE_BPS,
  ERC20_APPROVE_ABI,
  GAS_LIMIT_APPROVE,
  GAS_LIMIT_SWAP,
  PANCAKE_ROUTER_ABI,
  PANCAKE_ROUTER_ADDRESS,
  RPC,
  USDT_ABI,
  USDT_CONTRACT_ADDRESS,
  USDT_DECIMALS,
  WBNB_ADDRESS,
} from "./transaction";

import { ethers } from "ethers";

export type SwapDirection = "BNB_TO_USDT" | "USDT_TO_BNB";

export interface SwapQuote {
  direction: SwapDirection;
  amountIn: string;
  amountOut: string;
  path: string[];
  priceImpact: string;
}

export interface SwapResult {
  txHash: string;
  direction: SwapDirection;
  amountIn: string;
  amountOut: string;
}

class SwapRouter {
  provider: ethers.JsonRpcProvider;
  wallet: ethers.Wallet;
  address: string | undefined;
  private router: ethers.Contract;

  constructor({
    privateKey,
    provider = null,
  }: {
    privateKey: string;
    provider?: ethers.JsonRpcProvider | null;
  }) {
    this.provider = provider || new ethers.JsonRpcProvider(RPC);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.router = new ethers.Contract(
      PANCAKE_ROUTER_ADDRESS,
      PANCAKE_ROUTER_ABI,
      this.wallet,
    );
  }

  async initialize() {
    this.address = await this.wallet.getAddress();
    console.log("SwapRouter using address:", this.address);
  }

  /**
   * @method _getPath
   * Returns the token path for the given swap direction.
   */
  private _getPath(direction: SwapDirection): string[] {
    if (direction === "BNB_TO_USDT") {
      return [WBNB_ADDRESS, USDT_CONTRACT_ADDRESS];
    }
    return [USDT_CONTRACT_ADDRESS, WBNB_ADDRESS];
  }

  /**
   * @method _getDeadline
   * Returns a Unix timestamp deadline for the swap.
   */
  private _getDeadline(offsetSeconds = DEFAULT_DEADLINE_SECONDS): number {
    return Math.floor(Date.now() / 1000) + offsetSeconds;
  }

  /**
   * @method _applySlippage
   * Applies slippage tolerance to the expected output amount.
   */
  private _applySlippage(
    amountOut: bigint,
    slippageBps = DEFAULT_SLIPPAGE_BPS,
  ): bigint {
    return (amountOut * BigInt(10_000 - slippageBps)) / BigInt(10_000);
  }

  /**
   * @method _ensureAllowance
   * Ensures the USDT allowance for the PancakeSwap Router is sufficient.
   * If not, sends an approval transaction.
   */
  private async _ensureAllowance(amount: bigint): Promise<void> {
    if (!this.address) {
      throw new Error("Wallet address is not initialized.");
    }

    const usdtContract = new ethers.Contract(
      USDT_CONTRACT_ADDRESS,
      [...USDT_ABI, ...ERC20_APPROVE_ABI],
      this.wallet,
    );

    const currentAllowance: bigint = await usdtContract.allowance(
      this.address,
      PANCAKE_ROUTER_ADDRESS,
    );

    if (currentAllowance >= amount) {
      console.log("Sufficient USDT allowance already set.");
      return;
    }

    console.log("Approving USDT spend for PancakeSwap Router...");

    const approveTx = await usdtContract.approve(
      PANCAKE_ROUTER_ADDRESS,
      ethers.MaxUint256,
      {
        gasLimit: GAS_LIMIT_APPROVE,
        gasPrice: BASE_GAS_PRICE,
      },
    );

    await approveTx.wait();
    console.log("✅ USDT approval confirmed. Tx Hash:", approveTx.hash);
  }

  /**
   * @method getQuote
   * Gets the expected output amount for a given swap without executing it.
   */
  async getQuote({
    direction,
    amount,
    slippageBps = DEFAULT_SLIPPAGE_BPS,
  }: {
    direction: SwapDirection;
    amount: string;
    slippageBps?: number;
  }): Promise<SwapQuote> {
    const path = this._getPath(direction);

    const amountIn =
      direction === "BNB_TO_USDT"
        ? ethers.parseEther(amount)
        : ethers.parseUnits(amount, USDT_DECIMALS);

    const amounts: bigint[] = await this.router.getAmountsOut(amountIn, path);
    const rawAmountOut = amounts[amounts.length - 1];
    const amountOutMin = this._applySlippage(rawAmountOut, slippageBps);

    const formatIn =
      direction === "BNB_TO_USDT"
        ? ethers.formatEther(amountIn)
        : ethers.formatUnits(amountIn, USDT_DECIMALS);

    const formatOut =
      direction === "BNB_TO_USDT"
        ? ethers.formatUnits(rawAmountOut, USDT_DECIMALS)
        : ethers.formatEther(rawAmountOut);

    const formatImpact =
      direction === "BNB_TO_USDT"
        ? ethers.formatUnits(rawAmountOut - amountOutMin, USDT_DECIMALS)
        : ethers.formatEther(rawAmountOut - amountOutMin);

    return {
      direction,
      amountIn: formatIn,
      amountOut: formatOut,
      path,
      priceImpact: formatImpact,
    };
  }

  /**
   * @method swapBNBToUSDT
   * Swaps an exact amount of BNB for USDT via PancakeSwap.
   */
  async swapBNBToUSDT({
    amount,
    slippageBps = DEFAULT_SLIPPAGE_BPS,
  }: {
    amount: string;
    slippageBps?: number;
  }): Promise<SwapResult> {
    if (!this.address) {
      throw new Error("Wallet address is not initialized.");
    }

    const path = this._getPath("BNB_TO_USDT");
    const amountIn = ethers.parseEther(amount);
    const deadline = this._getDeadline();

    /** Get expected output */
    const amounts: bigint[] = await this.router.getAmountsOut(amountIn, path);
    const expectedOut = amounts[amounts.length - 1];
    const amountOutMin = this._applySlippage(expectedOut, slippageBps);

    console.log(`\n--- Swapping ${amount} BNB → USDT ---`);
    console.log(
      `Expected output: ${ethers.formatUnits(expectedOut, USDT_DECIMALS)} USDT`,
    );
    console.log(
      `Minimum output (after slippage): ${ethers.formatUnits(
        amountOutMin,
        USDT_DECIMALS,
      )} USDT`,
    );

    const tx = await this.router.swapExactETHForTokens(
      amountOutMin,
      path,
      this.address,
      deadline,
      {
        value: amountIn,
        gasLimit: GAS_LIMIT_SWAP,
        gasPrice: BASE_GAS_PRICE,
      },
    );

    const receipt = await tx.wait();
    console.log("✅ Swap confirmed. Tx Hash:", tx.hash);
    console.log("Receipt:", receipt);

    return {
      txHash: tx.hash,
      direction: "BNB_TO_USDT",
      amountIn: amount,
      amountOut: ethers.formatUnits(expectedOut, USDT_DECIMALS),
    };
  }

  /**
   * @method swapUSDTToBNB
   * Swaps an exact amount of USDT for BNB via PancakeSwap.
   */
  async swapUSDTToBNB({
    amount,
    slippageBps = DEFAULT_SLIPPAGE_BPS,
  }: {
    amount: string;
    slippageBps?: number;
  }): Promise<SwapResult> {
    if (!this.address) {
      throw new Error("Wallet address is not initialized.");
    }

    const path = this._getPath("USDT_TO_BNB");
    const amountIn = ethers.parseUnits(amount, USDT_DECIMALS);
    const deadline = this._getDeadline();

    /** Get expected output */
    const amounts: bigint[] = await this.router.getAmountsOut(amountIn, path);
    const expectedOut = amounts[amounts.length - 1];
    const amountOutMin = this._applySlippage(expectedOut, slippageBps);

    console.log(`\n--- Swapping ${amount} USDT → BNB ---`);
    console.log(`Expected output: ${ethers.formatEther(expectedOut)} BNB`);
    console.log(
      `Minimum output (after slippage): ${ethers.formatEther(
        amountOutMin,
      )} BNB`,
    );

    /** Ensure USDT allowance */
    await this._ensureAllowance(amountIn);

    const tx = await this.router.swapExactTokensForETH(
      amountIn,
      amountOutMin,
      path,
      this.address,
      deadline,
      {
        gasLimit: GAS_LIMIT_SWAP,
        gasPrice: BASE_GAS_PRICE,
      },
    );

    const receipt = await tx.wait();
    console.log("✅ Swap confirmed. Tx Hash:", tx.hash);
    console.log("Receipt:", receipt);

    return {
      txHash: tx.hash,
      direction: "USDT_TO_BNB",
      amountIn: amount,
      amountOut: ethers.formatEther(expectedOut),
    };
  }

  /**
   * @method swap
   * Unified swap method — swaps BNB ↔ USDT based on the given direction.
   */
  async swap({
    direction,
    amount,
    slippageBps = DEFAULT_SLIPPAGE_BPS,
  }: {
    direction: SwapDirection;
    amount: string;
    slippageBps?: number;
  }): Promise<SwapResult> {
    if (direction === "BNB_TO_USDT") {
      return this.swapBNBToUSDT({ amount, slippageBps });
    }
    return this.swapUSDTToBNB({ amount, slippageBps });
  }
}

export default SwapRouter;
