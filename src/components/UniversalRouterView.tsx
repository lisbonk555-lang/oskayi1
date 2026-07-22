import React, { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, Zap, ShieldCheck, ArrowRight, Coins, Percent, AlertCircle } from 'lucide-react';
import { UniversalRouteQuote } from '../types';
import { getArbitrageQuote } from '../services/api';

interface UniversalRouterViewProps {
  selectedChainId: number;
}

export const UniversalRouterView: React.FC<UniversalRouterViewProps> = ({ selectedChainId }) => {
  const [targetAmount, setTargetAmount] = useState<number>(100000);
  const [discountPercent, setDiscountPercent] = useState<number>(15);
  const [assetSymbol, setAssetSymbol] = useState<string>('USDC');
  const [minProfitMarginPercent, setMinProfitMarginPercent] = useState<number>(2.0);
  const [quote, setQuote] = useState<UniversalRouteQuote | null>(null);
  const [loading, setLoading] = useState(false);

  const calculateQuote = async () => {
    try {
      setLoading(true);
      const q = await getArbitrageQuote({
        chainId: selectedChainId,
        assetSymbol,
        assetAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        targetAmount,
        discountPercent,
        minProfitMarginPercent
      });
      setQuote(q);
    } catch (err) {
      console.error('Failed getting route quote:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateQuote();
  }, [selectedChainId, targetAmount, discountPercent, assetSymbol, minProfitMarginPercent]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>UNIVERSAL LIQUIDITY ROUTER SIMULATOR</span>
          </div>
          <h2 className="text-xl font-bold text-white">Cross-DEX Arbitrage Resale Router</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Simulate flash loan resale execution across 1inch, Uniswap V3, Curve 3pool, and Balancer V2 to discover optimal resale prices and verify revert safety guard conditions.
          </p>
        </div>
      </div>

      {/* Simulator Inputs & Output Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
            <Coins className="w-4 h-4 text-emerald-400" />
            <span>Arbitrage Parameters</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Target Project Funding ({assetSymbol})
            </label>
            <input
              type="number"
              step={5000}
              value={targetAmount}
              onChange={(e) => setTargetAmount(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Offered Discount Rate (%)
            </label>
            <input
              type="range"
              min={1}
              max={30}
              step={0.5}
              value={discountPercent}
              onChange={(e) => setDiscountPercent(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-xs font-mono text-slate-400 mt-1">
              <span>1%</span>
              <span className="text-emerald-400 font-bold">{discountPercent}%</span>
              <span>30%</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Minimum Required Profit Guard (%)
            </label>
            <input
              type="number"
              step={0.5}
              value={minProfitMarginPercent}
              onChange={(e) => setMinProfitMarginPercent(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Target Asset
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

        {/* Results Column */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2 text-sm font-bold text-slate-100">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Universal Router Quote Breakdown</span>
            </div>
            {quote && (
              <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                quote.revertGuardStatus === 'PASSED'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-red-950 text-red-400 border border-red-800'
              }`}>
                Safety Guard: {quote.revertGuardStatus}
              </span>
            )}
          </div>

          {quote ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-850 text-xs font-mono">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Flash Borrowed</div>
                  <div className="text-base font-bold text-emerald-400">${quote.borrowAmount.toLocaleString()}</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Aave Fee (0.05%)</div>
                  <div className="text-base font-bold text-slate-300">${quote.flashLoanFeeAmount.toFixed(2)}</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Resale Proceeds</div>
                  <div className="text-base font-bold text-cyan-400">${quote.estimatedResaleProceeds.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Disbursed Profit</div>
                  <div className="text-base font-bold text-emerald-400">${quote.netProfitDisbursedToVisionUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                </div>
              </div>

              {/* Protocol Allocations */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 mb-2">Multi-Pool Liquidity Routing Split</h4>
                <div className="space-y-2">
                  {quote.routeDetails.map((rt, i) => (
                    <div key={i} className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center justify-between text-xs font-mono">
                      <div>
                        <div className="text-slate-100 font-bold">{rt.protocol}</div>
                        <div className="text-[10px] text-slate-500">Contract: {rt.dexAddress}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-emerald-400 font-bold">{rt.percentage}% Liquidity</div>
                        <div className="text-[10px] text-slate-400">Effective Rate: ${rt.effectivePriceUsd}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 font-mono text-xs">
              Calculating universal route quote...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
