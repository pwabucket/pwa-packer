import { ethers } from "ethers";
import { RPC } from "./transaction";

const MAX_ADDRESSES_PER_PROVIDER = 20;

interface ProviderPoolEntry {
  addressCount: number;
  providerInstance: ethers.JsonRpcProvider;
}

class ProviderCache {
  private addressToProviderMap: Map<string, ethers.JsonRpcProvider>;
  private providerPool: ProviderPoolEntry[];

  constructor() {
    this.addressToProviderMap = new Map();
    this.providerPool = [];
  }

  getProvider(walletAddress: string): ethers.JsonRpcProvider {
    /* Return cached provider if already exists for this address */
    const cachedProvider = this.addressToProviderMap.get(walletAddress);
    if (cachedProvider) {
      return cachedProvider;
    }

    /* Find an existing provider that hasn't reached capacity */
    const availableProviderEntry = this.providerPool.find(
      (entry) => entry.addressCount < MAX_ADDRESSES_PER_PROVIDER
    );

    if (availableProviderEntry) {
      availableProviderEntry.addressCount += 1;
      this.addressToProviderMap.set(
        walletAddress,
        availableProviderEntry.providerInstance
      );
      return availableProviderEntry.providerInstance;
    }

    /* Create new provider instance if none available */
    const newProviderInstance = new ethers.JsonRpcProvider(RPC);
    const newProviderEntry: ProviderPoolEntry = {
      addressCount: 1,
      providerInstance: newProviderInstance,
    };

    this.providerPool.push(newProviderEntry);
    this.addressToProviderMap.set(walletAddress, newProviderInstance);

    return newProviderInstance;
  }
}

export default ProviderCache;
