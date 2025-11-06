import { ethers } from "ethers";
import {
  RPC,
  USDT_ABI,
  USDT_CONTRACT_ADDRESS,
  USDT_DECIMALS,
} from "./transaction";

type UsdtTokenContract = ethers.Contract & {
  decimals: () => Promise<number>;
  symbol: () => Promise<string>;
  balanceOf: (address: string) => Promise<bigint>;
  transfer: (
    to: string,
    amount: bigint
  ) => Promise<ethers.ContractTransactionResponse>;
};

class WalletProvider {
  protected address: string;
  protected provider: ethers.JsonRpcProvider;
  protected usdtToken: UsdtTokenContract;

  constructor(address: string) {
    this.address = address;
    this.provider = new ethers.JsonRpcProvider(RPC);
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
    return Number(ethers.formatEther(balance));
  };

  /** Get USDT Balance */
  getUSDTBalance = async (): Promise<number> => {
    const balance = await this.usdtToken.balanceOf(this.address);
    return Number(ethers.formatUnits(balance, USDT_DECIMALS));
  };
}

export { WalletProvider };
