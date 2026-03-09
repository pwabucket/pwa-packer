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

/** PancakeSwap V2 Router */
export const PANCAKE_ROUTER_ADDRESS = IS_MAINNET
  ? "0x10ED43C718714eb63d5aA57B78B54704E256024E"
  : "0xD99D1c33F9fC3444f8101754aBC46c52416550D1";

/** Wrapped BNB */
export const WBNB_ADDRESS = IS_MAINNET
  ? "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
  : "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";

/** PancakeSwap Router ABI (subset for swaps) */
export const PANCAKE_ROUTER_ABI = [
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
];

/** ERC-20 approve ABI fragment */
export const ERC20_APPROVE_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

/** Gas limits for swap operations */
export const GAS_LIMIT_SWAP = 300_000n;
export const GAS_LIMIT_APPROVE = 60_000n;

/** Default deadline offset: 20 minutes */
export const DEFAULT_DEADLINE_SECONDS = 20 * 60;

/** Default slippage: 1% (expressed as basis points) */
export const DEFAULT_SLIPPAGE_BPS = 100;
