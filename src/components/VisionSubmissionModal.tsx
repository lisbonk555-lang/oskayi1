import React, { useState } from 'react';
import { X, PlusCircle, ShieldCheck, Zap, Coins, Percent, AlertCircle } from 'lucide-react';
import { createVision } from '../services/api';
import { Vision } from '../types';

interface VisionSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVisionCreated: (vision: Vision) => void;
  defaultWalletAddress?: string;
}

export const VisionSubmissionModal: React.FC<VisionSubmissionModalProps> = ({
  isOpen,
  onClose,
  onVisionCreated,
  defaultWalletAddress
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ownerAddress, setOwnerAddress] = useState(defaultWalletAddress || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F');
  const [assetSymbol, setAssetSymbol] = useState('USDC');
  const [targetAmount, setTargetAmount] = useState<number>(50000);
  const [discountPercent, setDiscountPercent] = useState<number>(12.5);
  const [category, setCategory] = useState('DeFi & AI');
  const [chainId, setChainId] = useState<number>(1);
  const [gasSponsored, setGasSponsored] = useState(true);
  const [minProfitMarginPercent, setMinProfitMarginPercent] = useState<number>(1.5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Live Calculations
  const discountedBorrowAmount = targetAmount * (1 - discountPercent / 100);
  const flashLoanFeeAmount = discountedBorrowAmount * 0.0005; // 0.05%
  const minRequiredProfitUsd = targetAmount * (minProfitMarginPercent / 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !ownerAddress.trim()) {
      setError('Title and Beneficiary Wallet Address are required');
      return;
    }

    if (targetAmount < 1 || targetAmount > 100000000) {
      setError('Target funding amount must be between $1 and $100,000,000 (100 Million USDC/Tokens)');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const created = await createVision({
        title,
        description,
        ownerAddress,
        assetSymbol,
        assetAddress: assetSymbol === 'USDT' ? '0xdAC17F958D2ee523a2206206994597C13D831ec7' : '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        targetAmount,
        discountPercent,
        category,
        tags: [category, assetSymbol, 'FlashLoan'],
        chainId,
        gasSponsored,
        minProfitMarginPercent
      });

      onVisionCreated(created);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit vision');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Submit New Vision for Arbitrage Funding</h2>
              <p className="text-xs text-slate-400">Oskayi Instant Capital Discounted Flash Loan Model</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-lg text-xs text-red-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Vision Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Autonomous AI Agent Liquidity Rebalancer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Project Summary / Description
            </label>
            <textarea
              rows={2}
              placeholder="Explain the vision scope, technology stack, and intended execution goals..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Beneficiary Wallet Address *
              </label>
              <input
                type="text"
                required
                value={ownerAddress}
                onChange={(e) => setOwnerAddress(e.target.value)}
                placeholder="0x..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Target Funding Asset
              </label>
              <select
                value={assetSymbol}
                onChange={(e) => setAssetSymbol(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="USDC">USDC (USD Coin)</option>
                <option value="USDT">USDT (Tether USD)</option>
                <option value="DAI">DAI (Multi-Collateral DAI)</option>
                <option value="WETH">WETH (Wrapped Ether)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Target Funding Needed ({assetSymbol})
              </label>
              <input
                type="number"
                min={1}
                max={100000000}
                step={1}
                value={targetAmount}
                onChange={(e) => setTargetAmount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-400 font-mono mt-1">
                Supported Range: <span className="text-emerald-400 font-bold">$1</span> to <span className="text-emerald-400 font-bold">$100,000,000</span> {assetSymbol} ($100 Million Max)
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Offered Discount Percentage (%)
              </label>
              <input
                type="number"
                min={0.1}
                max={50}
                step={0.1}
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-400 font-mono mt-1">
                Discount Range: 0.1% to 50.0%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Deployment Network (EVM Chain)
              </label>
              <select
                value={chainId}
                onChange={(e) => setChainId(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value={1}>Ethereum Mainnet (Chain 1)</option>
                <option value={42161}>Arbitrum One (Chain 42161)</option>
                <option value={137}>Polygon Mainnet (Chain 137)</option>
                <option value={8453}>Base Mainnet (Chain 8453)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="DeFi & AI">DeFi & AI</option>
                <option value="Privacy & Infrastructure">Privacy & Infrastructure</option>
                <option value="ReFi & Climate">ReFi & Climate</option>
                <option value="Public Goods">Public Goods</option>
                <option value="Tooling & SDKs">Tooling & SDKs</option>
              </select>
            </div>
          </div>

          {/* Live Discount & Flash Loan Math Summary */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Oskayi Capital Efficiency Math</span>
            </div>

            <div className="flex justify-between text-slate-400">
              <span>Full Funding Target Needed:</span>
              <span className="text-slate-200">${targetAmount.toLocaleString()} {assetSymbol}</span>
            </div>

            <div className="flex justify-between text-slate-400">
              <span>Discounted Flash Loan Borrowed Amount:</span>
              <span className="text-emerald-400 font-bold">${discountedBorrowAmount.toLocaleString()} {assetSymbol}</span>
            </div>

            <div className="flex justify-between text-slate-400">
              <span>Aave V3 Flash Loan Fee (0.05%):</span>
              <span className="text-slate-300">${flashLoanFeeAmount.toFixed(2)} {assetSymbol}</span>
            </div>

            <div className="flex justify-between text-slate-400 border-t border-slate-850 pt-2">
              <span>Minimum Profit Surplus Guard:</span>
              <span className="text-cyan-400 font-bold">${minRequiredProfitUsd.toLocaleString()} {assetSymbol}</span>
            </div>
          </div>

          {/* EIP-2771 Gas Sponsorship Toggle */}
          <div className="flex items-center space-x-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <input
              type="checkbox"
              id="gasSponsorship"
              checked={gasSponsored}
              onChange={(e) => setGasSponsored(e.target.checked)}
              className="w-4 h-4 text-emerald-500 bg-slate-900 border-slate-700 rounded focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="gasSponsorship" className="text-xs text-slate-300 cursor-pointer flex-1">
              <span className="font-semibold text-white flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline" />
                <span>Enable EIP-2771 Meta-Transaction Gas Sponsorship</span>
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Vision owner pays 0 gas fees upfront. Relayer pays gas upon successful arbitrage execution.
              </p>
            </label>
          </div>

          {/* Form Controls */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition-all shadow-md flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Submitting Vision...' : 'Publish Vision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
