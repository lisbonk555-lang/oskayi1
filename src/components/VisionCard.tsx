import React from 'react';
import { Vision } from '../types';
import { Zap, ShieldCheck, ArrowRight, Wallet, Percent, Coins, CheckCircle2 } from 'lucide-react';

interface VisionCardProps {
  vision: Vision;
  onSelectVision: (vision: Vision) => void;
}

export const VisionCard: React.FC<VisionCardProps> = ({ vision, onSelectVision }) => {
  const isFunded = vision.status === 'funded';

  return (
    <div className={`bg-slate-900 rounded-xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-md hover:shadow-xl ${
      isFunded
        ? 'border-emerald-500/40 bg-slate-900/90'
        : 'border-slate-800 hover:border-emerald-500/40'
    }`}>
      {/* Header Badge Row */}
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
              {vision.category}
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-850 text-slate-400 border border-slate-800">
              Chain {vision.chainId}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {vision.gasSponsored && (
              <span className="flex items-center space-x-1 text-[10px] font-mono bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
                <ShieldCheck className="w-3 h-3" />
                <span>Gas Free</span>
              </span>
            )}
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${
              isFunded
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
            }`}>
              {isFunded ? 'Funded & Disbursed' : 'Active Vision'}
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-bold text-slate-100 mb-1.5 line-clamp-1 group-hover:text-emerald-400 transition-colors">
          {vision.title}
        </h3>
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
          {vision.description}
        </p>

        {/* Financial Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-3 rounded-lg border border-slate-850 mb-4">
          <div>
            <div className="text-[10px] uppercase font-mono text-slate-500 mb-0.5">Funding Target</div>
            <div className="text-sm font-bold font-mono text-slate-100 flex items-center space-x-1">
              <Coins className="w-3.5 h-3.5 text-cyan-400" />
              <span>{vision.targetAmount.toLocaleString()} {vision.assetSymbol}</span>
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-mono text-slate-500 mb-0.5">Discount Offered</div>
            <div className="text-sm font-bold font-mono text-emerald-400 flex items-center space-x-1">
              <Percent className="w-3.5 h-3.5" />
              <span>{vision.discountPercent}% Off</span>
            </div>
          </div>

          <div className="col-span-2 pt-2 border-t border-slate-850/80 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Flash Loan Borrow:</span>
            <span className="text-slate-200 font-semibold">
              ${vision.discountedAmount.toLocaleString()} {vision.assetSymbol}
            </span>
          </div>
        </div>

        {/* Owner Wallet Address */}
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 mb-2">
          <Wallet className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[11px] text-slate-300">
            {vision.ownerAddress.slice(0, 6)}...{vision.ownerAddress.slice(-4)}
          </span>
        </div>
      </div>

      {/* Card Footer / Action */}
      <div className="px-5 py-3 bg-slate-950/40 border-t border-slate-800 flex items-center justify-between">
        {isFunded ? (
          <div className="w-full flex items-center justify-between text-xs text-emerald-400 font-mono">
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Disbursed +${vision.realizedProfitAmount?.toLocaleString()}</span>
            </span>
            <button
              onClick={() => onSelectVision(vision)}
              className="text-slate-400 hover:text-slate-200 underline cursor-pointer"
            >
              Details
            </button>
          </div>
        ) : (
          <button
            onClick={() => onSelectVision(vision)}
            className="w-full py-2 px-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 text-xs font-bold rounded-lg flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            <span>Simulate & Execute Arbitrage</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
