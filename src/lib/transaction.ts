import { ethers } from "ethers";

/** Network Configuration */
export const IS_MAINNET = import.meta.env.PROD;
export const RPC = IS_MAINNET
  ? "https://bsc-dataseed.binance.org/"
  : "https://data-seed-prebsc-1-s1.binance.org:8545/";

/** USDT Contract Configuration */
export const USDT_DECIMALS = 18;
export const USDT_CONTRACT_ADDRESS = IS_MAINNET
  ? "0x55d398326f99059ff775485246999027b3197955"
  : "0x337610d27c682e347c9cd60bd4b3b107c9d34ddd";

export const USDT_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

/** Gas Price & Limits */
export const MINOR_GAS_INCREMENT = ethers.parseUnits("0.001", "gwei");
export const BASE_GAS_PRICE = ethers.parseUnits("0.13", "gwei");
export const GAS_LIMIT_NATIVE = 21_000n;
export const GAS_LIMITS_TRANSFER = {
  average: 50_000n,
  fast: 65_000n,
  instant: 75_000n,
};
