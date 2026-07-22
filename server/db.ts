import fs from 'fs';
import path from 'path';

export interface Vision {
  id: string;
  title: string;
  description: string;
  ownerAddress: string;
  assetSymbol: string;
  assetAddress: string;
  targetAmount: number; // e.g. 50000 USDC
  discountPercent: number; // e.g. 15 (%)
  discountedAmount: number; // targetAmount * (1 - discountPercent/100)
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

interface DatabaseData {
  visions: Vision[];
  relayedTransactions: RelayedTransaction[];
  executions: ArbitrageExecutionRecord[];
  botLogs: BotLog[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial seed data if file doesn't exist
const INITIAL_VISIONS: Vision[] = [
  {
    id: 'vis_01',
    title: 'Zero-Knowledge Privacy Layer for Micro-Grants',
    description: 'Constructing non-interactive ZK proof smart contracts for anonymous public goods micro-grant distribution on Ethereum L2s.',
    ownerAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    assetSymbol: 'USDC',
    assetAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    targetAmount: 50000,
    discountPercent: 12.5,
    discountedAmount: 43750,
    category: 'Privacy & Infrastructure',
    tags: ['ZeroKnowledge', 'Grants', 'Ethereum'],
    chainId: 1, // Ethereum Mainnet
    gasSponsored: true,
    minProfitMarginPercent: 2.0,
    status: 'active',
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString()
  },
  {
    id: 'vis_02',
    title: 'Autonomous AI Agent Liquidity Rebalancer',
    description: 'On-chain intelligent liquidity management protocol using verifiable off-chain inference and Aave flash loans for yield maxing.',
    ownerAddress: '0xF39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    assetSymbol: 'USDC',
    assetAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    targetAmount: 25000,
    discountPercent: 10.0,
    discountedAmount: 22500,
    category: 'DeFi & AI',
    tags: ['Arbitrum', 'AI', 'AaveV3'],
    chainId: 42161, // Arbitrum One
    gasSponsored: true,
    minProfitMarginPercent: 1.5,
    status: 'active',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'vis_03',
    title: 'DeCentralized Carbon Offset Verification Protocol',
    description: 'Verifiable IoT sensor registry backing real-world carbon offset tokenization and automated DEX market making.',
    ownerAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    assetSymbol: 'USDT',
    assetAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    targetAmount: 100000,
    discountPercent: 15.0,
    discountedAmount: 85000,
    category: 'ReFi & Climate',
    tags: ['Carbon', 'IoT', 'FlashLoans'],
    chainId: 137, // Polygon Mainnet
    gasSponsored: true,
    minProfitMarginPercent: 2.5,
    status: 'active',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
  }
];

class JsonDatabase {
  private data: DatabaseData;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseData {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(fileContent);
      }
    } catch (err) {
      console.error('Error reading database file, resetting to initial:', err);
    }
    const initial = {
      visions: INITIAL_VISIONS,
      relayedTransactions: [],
      executions: [],
      botLogs: []
    };
    this.saveData(initial);
    return initial;
  }

  private saveData(data: DatabaseData) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database file:', err);
    }
  }

  public getVisions(): Vision[] {
    return this.data.visions;
  }

  public getVisionById(id: string): Vision | undefined {
    return this.data.visions.find(v => v.id === id);
  }

  public addVision(vision: Omit<Vision, 'id' | 'createdAt' | 'status' | 'discountedAmount'>): Vision {
    const discountedAmount = vision.targetAmount * (1 - vision.discountPercent / 100);
    const newVision: Vision = {
      ...vision,
      id: `vis_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      discountedAmount,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    this.data.visions.unshift(newVision);
    this.saveData(this.data);
    return newVision;
  }

  public markVisionFunded(id: string, txHash: string, blockNumber: number, profitAmount: number): Vision | null {
    const vision = this.data.visions.find(v => v.id === id);
    if (!vision) return null;

    vision.status = 'funded';
    vision.fundedTxHash = txHash;
    vision.fundedBlockNumber = blockNumber;
    vision.fundedAt = new Date().toISOString();
    vision.realizedProfitAmount = profitAmount;

    this.saveData(this.data);
    return vision;
  }

  public addRelayedTransaction(tx: Omit<RelayedTransaction, 'id' | 'timestamp'>): RelayedTransaction {
    const record: RelayedTransaction = {
      ...tx,
      id: `relay_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString()
    };
    this.data.relayedTransactions.unshift(record);
    this.saveData(this.data);
    return record;
  }

  public getRelayedTransactions(): RelayedTransaction[] {
    return this.data.relayedTransactions;
  }

  public addExecutionRecord(record: Omit<ArbitrageExecutionRecord, 'id' | 'timestamp'>): ArbitrageExecutionRecord {
    const newRecord: ArbitrageExecutionRecord = {
      ...record,
      id: `exec_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString()
    };
    this.data.executions.unshift(newRecord);
    this.saveData(this.data);
    return newRecord;
  }

  public getExecutionRecords(): ArbitrageExecutionRecord[] {
    return this.data.executions;
  }

  public addBotLog(log: Omit<BotLog, 'id' | 'timestamp'>): BotLog {
    if (!this.data.botLogs) {
      this.data.botLogs = [];
    }
    const newLog: BotLog = {
      ...log,
      id: `bot_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString()
    };
    this.data.botLogs.unshift(newLog);
    this.saveData(this.data);
    return newLog;
  }

  public getBotLogs(): BotLog[] {
    return this.data.botLogs || [];
  }
}

export const db = new JsonDatabase();
