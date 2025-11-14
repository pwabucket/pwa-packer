import { ethers } from "ethers";
import { USDT_ABI, USDT_CONTRACT_ADDRESS, USDT_DECIMALS } from "./transaction";
import { providers } from "../services/providers";

type UsdtTokenContract = ethers.Contract & {
  decimals: () => Promise<number>;
  symbol: () => Promise<string>;
  balanceOf: (address: string) => Promise<bigint>;
  transfer: (
    to: string,
    amount: bigint,
    overrides?: ethers.Overrides
  ) => Promise<ethers.ContractTransactionResponse>;
};

class WalletReader {
  protected address: string;
  protected provider: ethers.JsonRpcProvider;
  protected usdtToken: UsdtTokenContract;

  constructor(address: string) {
    this.address = address;
    this.provider = providers.getProvider(address);
    this.usdtToken = new ethers.Contract(
      USDT_CONTRACT_ADDRESS,
      USDT_ABI,
      this.provider
    ) as UsdtTokenContract;
  }

  /** Get Ethers Provider */
  getProvider() {
    return this.provider;
  }

  /** Get USDT Token Contract */
  getUsdtTokenContract() {
    return this.usdtToken;
  }

  /** Get Wallet Address */
  getAddress() {
    return this.address;
  }

  /** Get BNB Balance */
  getBNBBalance = async (): Promise<number> => {
    const balance = await this.provider.getBalance(this.address);
    return parseFloat(ethers.formatEther(balance));
  };

  /** Get USDT Balance */
  getUSDTBalance = async (): Promise<number> => {
    const balance = await this.usdtToken.balanceOf(this.address);
    return parseFloat(ethers.formatUnits(balance, USDT_DECIMALS));
  };
}

export { WalletReader };
