import React from 'react';
import {
  Zap,
  Layers,
  Wallet,
  Globe,
  PlusCircle,
  Code2,
  History,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Bot
} from 'lucide-react';
import { NetworkRpcStatus, Web3WalletState } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  networkStatus: NetworkRpcStatus | null;
  selectedChainId: number;
  setSelectedChainId: (chainId: number) => void;
  wallet: Web3WalletState;
  onConnectWallet: () => void;
  onOpenSubmitModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  networkStatus,
  selectedChainId,
  setSelectedChainId,
  wallet,
  onConnectWallet,
  onOpenSubmitModal
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 backdrop-blur-md bg-opacity-95">
      {/* Top Banner - RPC & Network Status */}
      <div className="bg-slate-950 px-4 py-1.5 border-b border-slate-850 flex flex-wrap items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <div className={`w-2 h-2 rounded-full ${networkStatus?.status === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="font-mono text-slate-300 font-medium">{networkStatus?.networkName || 'EVM RPC'}</span>
          </div>
          {networkStatus && (
            <>
              <div className="text-slate-500">|</div>
              <div>Block <span className="font-mono text-slate-200">#{networkStatus.blockNumber.toLocaleString()}</span></div>
              <div className="text-slate-500">|</div>
              <div>Gas <span className="font-mono text-slate-200">{networkStatus.gasPriceGwei} Gwei</span></div>
              <div className="text-slate-500">|</div>
              <div>Latency <span className="font-mono text-slate-200">{networkStatus.latencyMs}ms</span></div>
            </>
          )}
        </div>

        <div className="flex items-center space-x-3 text-slate-400">
          <span className="bg-slate-800 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-mono border border-slate-700">
            EIP-2771 Gas Sponsored
          </span>
          <span className="bg-slate-800 text-cyan-400 px-2 py-0.5 rounded text-[10px] font-mono border border-slate-700">
            Aave V3 Flash Loan Engine
          </span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('visions')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 p-0.5 shadow-lg shadow-emerald-950/50 flex items-center justify-center">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-white">OSKAYI</h1>
              <span className="text-xs px-2 py-0.5 bg-emerald-950 text-emerald-400 font-mono rounded border border-emerald-800">
                INSTANT CAPITAL
              </span>
            </div>
            <p className="text-xs text-slate-400">Arbitrage Funding Protocol</p>
          </div>
        </div>

        {/* Chain Selector */}
        <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <Globe className="w-4 h-4 text-slate-400 ml-2" />
          <select
            value={selectedChainId}
            onChange={(e) => setSelectedChainId(Number(e.target.value))}
            className="bg-transparent text-xs font-mono text-slate-200 focus:outline-none cursor-pointer pr-2 py-1"
          >
            <option value={1} className="bg-slate-900">Ethereum Mainnet (Chain 1)</option>
            <option value={42161} className="bg-slate-900">Arbitrum One (Chain 42161)</option>
            <option value={137} className="bg-slate-900">Polygon Mainnet (Chain 137)</option>
            <option value={8453} className="bg-slate-900">Base Mainnet (Chain 8453)</option>
          </select>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenSubmitModal}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit Vision</span>
          </button>

          <button
            onClick={onConnectWallet}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
              wallet.connected
                ? 'bg-slate-800 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-200'
            }`}
          >
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>
              {wallet.connected && wallet.account
                ? `${wallet.account.slice(0, 6)}...${wallet.account.slice(-4)}`
                : 'Connect Wallet'}
            </span>
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60 overflow-x-auto">
        <nav className="flex space-x-1 py-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab('visions')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors cursor-pointer ${
              activeTab === 'visions'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Active Visions Catalog</span>
          </button>

          <button
            onClick={() => setActiveTab('flashloans')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors cursor-pointer ${
              activeTab === 'flashloans'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Aave Flash Loans</span>
          </button>

          <button
            onClick={() => setActiveTab('router')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors cursor-pointer ${
              activeTab === 'router'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Universal Router</span>
          </button>

          <button
            onClick={() => setActiveTab('relayer')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors cursor-pointer ${
              activeTab === 'relayer'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>EIP-2771 Gas Sponsor</span>
          </button>

          <button
            onClick={() => setActiveTab('contract')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors cursor-pointer ${
              activeTab === 'contract'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Solidity Contract</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Execution History</span>
          </button>

          <button
            onClick={() => setActiveTab('bot')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors cursor-pointer ${
              activeTab === 'bot'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Bot className="w-4 h-4 text-emerald-400" />
            <span>DeFi Funding Bot</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
