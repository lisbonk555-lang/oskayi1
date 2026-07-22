import React, { useState, useEffect } from 'react';
import {
  Zap,
  Search,
  Filter,
  Layers,
  ShieldCheck,
  TrendingUp,
  Coins,
  Cpu,
  RefreshCw,
  PlusCircle,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Vision, NetworkRpcStatus, Web3WalletState } from './types';
import { getVisions, getNetworkStatus, connectWeb3Wallet } from './services/api';
import { Header } from './components/Header';
import { VisionCard } from './components/VisionCard';
import { VisionSubmissionModal } from './components/VisionSubmissionModal';
import { VisionDetailsModal } from './components/VisionDetailsModal';
import { FlashLoanAggregatorView } from './components/FlashLoanAggregatorView';
import { UniversalRouterView } from './components/UniversalRouterView';
import { GasRelayerView } from './components/GasRelayerView';
import { SmartContractCodeView } from './components/SmartContractCodeView';
import { ExecutionHistoryView } from './components/ExecutionHistoryView';
import { BotControlCenterView } from './components/BotControlCenterView';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('visions');
  const [selectedChainId, setSelectedChainId] = useState<number>(1);
  const [visions, setVisions] = useState<Vision[]>([]);
  const [networkStatus, setNetworkStatus] = useState<NetworkRpcStatus | null>(null);
  const [selectedVision, setSelectedVision] = useState<Vision | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Wallet State
  const [wallet, setWallet] = useState<Web3WalletState>({
    connected: false,
    account: null,
    chainId: null,
    balanceEth: null,
    isMetaMask: false
  });

  const [loadingVisions, setLoadingVisions] = useState(false);

  // Fetch Visions & RPC Network Status
  const loadInitialData = async () => {
    try {
      setLoadingVisions(true);
      const v = await getVisions();
      setVisions(v);

      const status = await getNetworkStatus(selectedChainId);
      setNetworkStatus(status as NetworkRpcStatus);
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setLoadingVisions(false);
    }
  };

  useEffect(() => {
    loadInitialData();
    const interval = setInterval(async () => {
      try {
        const status = await getNetworkStatus(selectedChainId);
        setNetworkStatus(status as NetworkRpcStatus);
      } catch (e) {
        // quiet
      }
    }, 12000);
    return () => clearInterval(interval);
  }, [selectedChainId]);

  const handleConnectWallet = async () => {
    try {
      const state = await connectWeb3Wallet();
      setWallet(state);
    } catch (err: any) {
      alert(err?.message || 'Failed connecting wallet');
    }
  };

  const handleVisionCreated = (newVision: Vision) => {
    setVisions(prev => [newVision, ...prev]);
  };

  const handleSelectVision = (vision: Vision) => {
    setSelectedVision(vision);
    setIsDetailsModalOpen(true);
  };

  // Filtered Visions
  const filteredVisions = visions.filter(v => {
    const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || v.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Overview Stats
  const totalFundingTargetUsd = visions.reduce((acc, v) => acc + v.targetAmount, 0);
  const totalDiscountedBorrowUsd = visions.reduce((acc, v) => acc + v.discountedAmount, 0);
  const avgDiscount = visions.length > 0 ? (visions.reduce((acc, v) => acc + v.discountPercent, 0) / visions.length).toFixed(1) : '0.0';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Platform Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        networkStatus={networkStatus}
        selectedChainId={selectedChainId}
        setSelectedChainId={setSelectedChainId}
        wallet={wallet}
        onConnectWallet={handleConnectWallet}
        onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {activeTab === 'visions' && (
          <div className="space-y-8">
            {/* Hero Protocol Banner */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
              <div className="relative z-10 max-w-3xl space-y-3">
                <div className="inline-flex items-center space-x-2 bg-emerald-950 text-emerald-400 px-3 py-1 rounded-full text-xs font-mono border border-emerald-800">
                  <Zap className="w-3.5 h-3.5 fill-emerald-400" />
                  <span>OSKAYI INSTANT CAPITAL MODEL</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                  Fund Project Visions Through Automated Flash Loan Arbitrage
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Borrow discounted capital via Aave V3 flash loans, execute universal DEX resale swaps across liquidity pools, repay loan principal plus interest, and disburse 100% of profit surplus directly into project wallets with 0 upfront gas fees.
                </p>
              </div>

              {/* Protocol High-level Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-850">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Active Visions</div>
                  <div className="text-lg font-bold font-mono text-slate-100">{visions.length} Projects</div>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-850">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Target Funding</div>
                  <div className="text-lg font-bold font-mono text-cyan-400">${totalFundingTargetUsd.toLocaleString()}</div>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-850">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Flash Loan Borrow</div>
                  <div className="text-lg font-bold font-mono text-emerald-400">${totalDiscountedBorrowUsd.toLocaleString()}</div>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-850">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Avg Discount</div>
                  <div className="text-lg font-bold font-mono text-emerald-400">{avgDiscount}% Off</div>
                </div>
              </div>
            </div>

            {/* Controls & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
              {/* Search Bar */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search visions, tags, or wallet addresses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto text-xs font-medium">
                {['ALL', 'DeFi & AI', 'Privacy & Infrastructure', 'ReFi & Climate', 'Public Goods'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Visions Cards Grid */}
            {loadingVisions ? (
              <div className="p-12 text-center text-slate-500 font-mono text-xs animate-pulse">
                Syncing project visions with EVM RPC & Database...
              </div>
            ) : filteredVisions.length === 0 ? (
              <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <AlertCircle className="w-8 h-8 text-slate-600 mx-auto" />
                <div className="text-sm font-bold text-slate-300">No matching visions found</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try adjusting your search query or submit a new project vision to trigger the flash loan arbitrage funding engine.
                </p>
                <button
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="px-4 py-2 bg-emerald-500 text-slate-950 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Submit Vision
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVisions.map((vision) => (
                  <VisionCard
                    key={vision.id}
                    vision={vision}
                    onSelectVision={handleSelectVision}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Other Tabs */}
        {activeTab === 'flashloans' && (
          <FlashLoanAggregatorView selectedChainId={selectedChainId} />
        )}

        {activeTab === 'router' && (
          <UniversalRouterView selectedChainId={selectedChainId} />
        )}

        {activeTab === 'relayer' && (
          <GasRelayerView selectedChainId={selectedChainId} />
        )}

        {activeTab === 'contract' && (
          <SmartContractCodeView />
        )}

        {activeTab === 'history' && (
          <ExecutionHistoryView selectedChainId={selectedChainId} />
        )}

        {activeTab === 'bot' && (
          <BotControlCenterView selectedChainId={selectedChainId} />
        )}
      </main>

      {/* Modals */}
      <VisionSubmissionModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onVisionCreated={handleVisionCreated}
        defaultWalletAddress={wallet.account || undefined}
      />

      <VisionDetailsModal
        vision={selectedVision}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onVisionUpdated={loadInitialData}
        wallet={wallet}
      />

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 text-xs text-slate-500 font-mono text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            OSKAYI INSTANT CAPITAL &copy; {new Date().getFullYear()} — Decentralized Arbitrage Funding Platform
          </div>
          <div className="flex items-center space-x-4 text-slate-400">
            <span>Aave V3 Flash Loan Engine</span>
            <span>•</span>
            <span>EIP-2771 Gas Sponsor</span>
            <span>•</span>
            <span>Universal DEX Router</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
