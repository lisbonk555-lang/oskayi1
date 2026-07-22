import {
  Vision,
  NetworkRpcStatus,
  AaveReserveInfo,
  UniversalRouteQuote,
  SimulationResult,
  RelayedTransaction,
  ArbitrageExecutionRecord,
  Web3WalletState,
  BotLog,
  BotCommandResponse
} from '../types';

export async function getVisions(): Promise<Vision[]> {
  const res = await fetch('/api/visions');
  if (!res.ok) throw new Error('Failed fetching visions');
  const data = await res.json();
  return data.visions;
}

export async function getVisionById(id: string): Promise<Vision> {
  const res = await fetch(`/api/visions/${id}`);
  if (!res.ok) throw new Error('Failed fetching vision');
  const data = await res.json();
  return data.vision;
}

export async function createVision(payload: {
  title: string;
  description: string;
  ownerAddress: string;
  assetSymbol: string;
  assetAddress: string;
  targetAmount: number;
  discountPercent: number;
  category: string;
  tags: string[];
  chainId: number;
  gasSponsored: boolean;
  minProfitMarginPercent: number;
}): Promise<Vision> {
  const res = await fetch('/api/visions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed creating vision');
  }
  const data = await res.json();
  return data.vision;
}

export async function getNetworkStatus(chainId: number, all = false): Promise<NetworkRpcStatus | NetworkRpcStatus[]> {
  const url = all ? '/api/rpc/status?all=true' : `/api/rpc/status?chainId=${chainId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed fetching RPC network status');
  const data = await res.json();
  return all ? data.networks : data.status;
}

export async function getAaveReserveData(chainId: number, assetAddress: string, assetSymbol: string): Promise<AaveReserveInfo> {
  const res = await fetch(`/api/aave/reserve?chainId=${chainId}&assetAddress=${assetAddress}&assetSymbol=${assetSymbol}`);
  if (!res.ok) throw new Error('Failed fetching Aave reserve');
  const data = await res.json();
  return data.reserveInfo;
}

export async function getArbitrageQuote(params: {
  chainId: number;
  assetSymbol: string;
  assetAddress: string;
  targetAmount: number;
  discountPercent: number;
  minProfitMarginPercent: number;
}): Promise<UniversalRouteQuote> {
  const res = await fetch('/api/arbitrage/quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) throw new Error('Failed calculating quote');
  const data = await res.json();
  return data.quote;
}

export async function simulateArbitrage(params: {
  chainId: number;
  visionId: string;
  executorAddress?: string;
  userAddress?: string;
}): Promise<SimulationResult> {
  const res = await fetch('/api/arbitrage/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) throw new Error('Failed running simulation');
  const data = await res.json();
  return data.simulation;
}

export async function executeArbitrage(params: {
  visionId: string;
  chainId: number;
  executorAddress?: string;
  userAddress?: string;
}): Promise<{
  success: boolean;
  vision: Vision;
  executionRecord: ArbitrageExecutionRecord;
  quote: UniversalRouteQuote;
}> {
  const res = await fetch('/api/arbitrage/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Arbitrage execution failed');
  }
  return await res.json();
}

export async function relaySponsorTx(payload: any): Promise<any> {
  const res = await fetch('/api/relayer/sponsor-tx', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed relaying gas sponsored transaction');
  }
  return await res.json();
}

export async function getRelayedHistory(): Promise<RelayedTransaction[]> {
  const res = await fetch('/api/relayer/transactions');
  if (!res.ok) throw new Error('Failed fetching relayed transactions');
  const data = await res.json();
  return data.transactions;
}

export async function getExecutionHistory(): Promise<ArbitrageExecutionRecord[]> {
  const res = await fetch('/api/history/executions');
  if (!res.ok) throw new Error('Failed fetching execution history');
  const data = await res.json();
  return data.executions;
}

export async function sendBotCommand(payload: {
  platform: 'telegram' | 'discord' | 'web';
  userId: string;
  userName: string;
  commandText: string;
  chainId?: number;
}): Promise<BotCommandResponse> {
  const res = await fetch('/api/bot/command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Bot command failed');
  }
  return await res.json();
}

export async function getBotLogs(): Promise<BotLog[]> {
  const res = await fetch('/api/bot/logs');
  if (!res.ok) throw new Error('Failed fetching bot activity logs');
  const data = await res.json();
  return data.logs;
}

export async function connectWeb3Wallet(): Promise<Web3WalletState> {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    try {
      const ethereum = (window as any).ethereum;
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
      const chainId = parseInt(chainIdHex, 16);

      let balanceEth = '0.00';
      if (accounts[0]) {
        const balanceHex = await ethereum.request({
          method: 'eth_getBalance',
          params: [accounts[0], 'latest']
        });
        const balanceWei = BigInt(balanceHex);
        balanceEth = (Number(balanceWei) / 1e18).toFixed(4);
      }

      return {
        connected: true,
        account: accounts[0],
        chainId,
        balanceEth,
        isMetaMask: Boolean(ethereum.isMetaMask)
      };
    } catch (err: any) {
      console.error('Wallet connection rejected:', err);
      throw new Error(err.message || 'User rejected wallet connection');
    }
  } else {
    throw new Error('No EIP-1193 Web3 Wallet (MetaMask, Rabby, Coinbase) detected in browser.');
  }
}
