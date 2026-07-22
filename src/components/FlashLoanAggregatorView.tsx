import React, { useState, useEffect } from 'react';
import { Cpu, RefreshCw, Zap, Shield, CheckCircle2, ArrowUpRight, Coins } from 'lucide-react';
import { AaveReserveInfo } from '../types';
import { getAaveReserveData } from '../services/api';

interface FlashLoanAggregatorViewProps {
  selectedChainId: number;
}

export const FlashLoanAggregatorView: React.FC<FlashLoanAggregatorViewProps> = ({ selectedChainId }) => {
  const [reserves, setReserves] = useState<AaveReserveInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const ASSETS = [
    { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
    { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
    { symbol: 'DAI', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F' },
    { symbol: 'WETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' }
  ];

  const fetchAllReserves = async () => {
    try {
      setLoading(true);
      const results = await Promise.all(
        ASSETS.map(a => getAaveReserveData(selectedChainId, a.address, a.symbol))
      );
      setReserves(results);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error fetching reserves:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllReserves();
  }, [selectedChainId]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 mb-1">
            <Cpu className="w-4 h-4" />
            <span>REAL-TIME ON-CHAIN FLASH LOAN AGGREGATOR</span>
          </div>
          <h2 className="text-xl font-bold text-white">Aave V3 & Multi-Pool Liquidity Depth</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Oskayi Instant Capital queries live Aave V3 liquidity reserve contracts directly via EVM JSON-RPC to inspect borrowing capacity and flash loan fees without intermediary indexers.
          </p>
        </div>

        <button
          onClick={fetchAllReserves}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-750 text-emerald-400 text-xs font-mono font-semibold rounded-xl border border-slate-700 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Querying RPC...' : 'Refresh RPC Data'}</span>
        </button>
      </div>

      {/* Reserves Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Aave V3 Liquidity Reserves (Chain {selectedChainId})</span>
          </div>
          {lastRefreshed && (
            <span className="text-[11px] font-mono text-slate-400">
              Last EVM RPC sync: {lastRefreshed}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
              <tr>
                <th className="px-6 py-3">Asset Token</th>
                <th className="px-6 py-3">Available Liquidity</th>
                <th className="px-6 py-3">Deposit APR</th>
                <th className="px-6 py-3">Variable Borrow APR</th>
                <th className="px-6 py-3">Flash Fee</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {reserves.map((res, i) => (
                <tr key={i} className="hover:bg-slate-850/50 transition-colors">
                  <td className="px-6 py-4 font-bold flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold text-xs">
                      {res.assetSymbol.slice(0, 1)}
                    </div>
                    <div>
                      <div className="text-sm text-slate-100">{res.assetSymbol}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {res.assetAddress.slice(0, 6)}...{res.assetAddress.slice(-4)}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-emerald-400">
                      ${res.availableLiquidityUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-[10px] text-slate-500">Uncollateralized Flash Liquidity</div>
                  </td>

                  <td className="px-6 py-4 text-slate-300">
                    {res.liquidityRateAPR}%
                  </td>

                  <td className="px-6 py-4 text-cyan-400 font-bold">
                    {res.variableBorrowRateAPR}%
                  </td>

                  <td className="px-6 py-4 text-slate-300">
                    <span className="bg-slate-800 text-emerald-400 px-2 py-0.5 rounded text-[11px] border border-slate-700">
                      {res.flashLoanFeeBps} bps (0.05%)
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="flex items-center space-x-1.5 text-emerald-400 font-semibold text-[11px]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Ready for Instant Capital</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
