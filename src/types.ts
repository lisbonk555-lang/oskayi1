export interface Vision {
  id: string;
  title: string;
  description: string;
  ownerAddress: string;
  assetSymbol: string;
  assetAddress: string;
  targetAmount: number;
  discountPercent: number;
  discountedAmount: number;
  category: string;
  tags: string[];
  chainId: number;
  gasSponsored: boolean;
  minProfitMarginPercent: number;
  status: 'active' | 'funded' | 'failed' | 'cancelled';
  createdAt: string;
  fundedTxHash?: string;
  fundedBlockNumber?: number;
  fundedAt?: string;
  realizedProfitAmount?: number;
}

export interface NetworkRpcStatus {
  chainId: number;
  networkName: string;
  blockNumber: number;
  gasPriceGwei: string;
  baseFeeGwei?: string;
  latencyMs: number;
  status: 'connected' | 'degraded' | 'offline';
  lastUpdated: string;
}

export interface AaveReserveInfo {
  assetSymbol: string;
  assetAddress: string;
  aTokenAddress: string;
  liquidityRateAPR: number;
  variableBorrowRateAPR: number;
  availableLiquidityUsd: number;
  flashLoanFeeBps: number;
  isFlashLoanable: boolean;
  blockFetched: number;
}

export interface UniversalRouteQuote {
  chainId: number;
  inputAsset: string;
  outputAsset: string;
  borrowAmount: number;
  estimatedResaleProceeds: number;
  flashLoanFeeAmount: number;
  targetFundingAmount: number;
  grossArbitrageSpreadUsd: number;
  netProfitDisbursedToVisionUsd: number;
  minProfitMarginUsd: number;
  routeDetails: Array<{
    protocol: string;
    percentage: number;
    effectivePriceUsd: number;
    dexAddress: string;
  }>;
  slippagePercent: number;
  isExecutionProfitable: boolean;
  revertGuardStatus: 'PASSED' | 'FAILED_REVERT_GUARD';
  executionGasEstimateUnits: number;
  estimatedGasCostGwei: string;
  estimatedGasCostUsd: number;
}

export interface SimulationResult {
  success: boolean;
  blockNumber: number;
  gasUsed: number;
  returnValRaw: string;
  revertReason?: string;
  logs: string[];
}

export interface RelayedTransaction {
  id: string;
  visionId: string;
  fromAddress: string;
  toContract: string;
  chainId: number;
  txHash: string;
  blockNumber: number;
  gasUsed: string;
  effectiveGasPriceGwei: string;
  gasCostUsd: number;
  sponsorName: string;
  status: 'relayed' | 'failed' | 'pending';
  timestamp: string;
}

export interface ArbitrageExecutionRecord {
  id: string;
  visionId: string;
  txHash: string;
  blockNumber: number;
  chainId: number;
  assetSymbol: string;
  flashLoanAmount: number;
  flashLoanFee: number;
  resaleProceeds: number;
  disbursedProfitToVision: number;
  gasSponsored: boolean;
  gasUsedGwei: string;
  executorAddress: string;
  dexRouteUsed: string;
  timestamp: string;
}

export interface Web3WalletState {
  connected: boolean;
  account: string | null;
  chainId: number | null;
  balanceEth: string | null;
  isMetaMask: boolean;
}

export interface BotLog {
  id: string;
  platform: 'telegram' | 'discord' | 'web';
  userId: string;
  userName: string;
  command: string;
  responseMessage: string;
  status: 'success' | 'failed' | 'pending';
  txHash?: string;
  visionId?: string;
  timestamp: string;
}

export interface BotCommandResponse {
  success: boolean;
  message: string;
  logs: string[];
  data?: any;
  actionTaken?: 'SUBMIT' | 'SCAN' | 'EXECUTE' | 'RELAY' | 'LIST' | 'STATUS' | 'HELP';
}

