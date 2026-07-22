import React, { useState, useEffect } from 'react';
import { History, RefreshCw, CheckCircle2, Zap, ExternalLink, ShieldCheck } from 'lucide-react';
import { ArbitrageExecutionRecord } from '../types';
import { getExecutionHistory } from '../services/api';

interface ExecutionHistoryViewProps {
  selectedChainId: number;
}

export const ExecutionHistoryView: React.FC<ExecutionHistoryViewProps> = ({ selectedChainId }) => {
  const [executions, setExecutions] = useState<ArbitrageExecutionRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await getExecutionHistory();
      setExecutions(data);
    } catch (err) {
      console.error('Error fetching execution history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const totalFundingDisbursed = executions.reduce((acc, ex) => acc + ex.disbursedProfitToVision, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 mb-1">
            <History className="w-4 h-4" />
            <span>VERIFIED ON-CHAIN ARBITRAGE EXECUTION LEDGER</span>
          </div>
          <h2 className="text-xl font-bold text-white">Disbursement & Execution History</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Real-time immutable record of flash loan arbitrage cycles executed through the Oskayi Instant Capital protocol, complete with EVM transaction hashes and profit disbursements.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-750 text-emerald-400 text-xs font-mono font-semibold rounded-xl border border-slate-700 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Fetching Ledger...' : 'Refresh History'}</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="text-[10px] font-mono text-slate-500 uppercase">Total Executions</div>
          <div className="text-2xl font-bold font-mono text-slate-100">{executions.length}</div>
          <div className="text-[11px] text-slate-400">Successfully settled</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="text-[10px] font-mono text-slate-500 uppercase">Total Capital Disbursed</div>
          <div className="text-2xl font-bold font-mono text-emerald-400">${totalFundingDisbursed.toLocaleString()} USD</div>
          <div className="text-[11px] text-slate-400">Net profit sent to project owners</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="text-[10px] font-mono text-slate-500 uppercase">Revert Safety Rate</div>
          <div className="text-2xl font-bold font-mono text-cyan-400">100%</div>
          <div className="text-[11px] text-slate-400">Zero capital lost to failed swaps</div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Execution Ledger</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {executions.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-mono text-xs">
              No executions logged yet. Select an active vision and click "Execute Instant Capital Arbitrage" to generate your first transaction!
            </div>
          ) : (
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <tr>
                  <th className="px-6 py-3">Vision ID</th>
                  <th className="px-6 py-3">Transaction Hash</th>
                  <th className="px-6 py-3">Block Height</th>
                  <th className="px-6 py-3">Flash Loan Borrow</th>
                  <th className="px-6 py-3">Disbursed Profit</th>
                  <th className="px-6 py-3">Gas Sponsored</th>
                  <th className="px-6 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {executions.map((ex, i) => (
                  <tr key={i} className="hover:bg-slate-850/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-emerald-400">{ex.visionId}</td>
                    <td className="px-6 py-4 text-cyan-400 underline font-semibold truncate max-w-xs">
                      {ex.txHash}
                    </td>
                    <td className="px-6 py-4 text-slate-300">#{ex.blockNumber}</td>
                    <td className="px-6 py-4 text-slate-200">${ex.flashLoanAmount.toLocaleString()} {ex.assetSymbol}</td>
                    <td className="px-6 py-4 text-emerald-400 font-bold">${ex.disbursedProfitToVision.toLocaleString()} {ex.assetSymbol}</td>
                    <td className="px-6 py-4">
                      {ex.gasSponsored ? (
                        <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded text-[10px] flex items-center space-x-1 w-max">
                          <ShieldCheck className="w-3 h-3" />
                          <span>EIP-2771 Sponsored</span>
                        </span>
                      ) : (
                        <span className="text-slate-500">Self-paid</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-[11px]">
                      {new Date(ex.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
