import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, Zap, CheckCircle2, FileText, Code, Check } from 'lucide-react';
import { RelayedTransaction } from '../types';
import { getRelayedHistory } from '../services/api';

interface GasRelayerViewProps {
  selectedChainId: number;
}

export const GasRelayerView: React.FC<GasRelayerViewProps> = ({ selectedChainId }) => {
  const [relayedTxs, setRelayedTxs] = useState<RelayedTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRelayedHistory = async () => {
    try {
      setLoading(true);
      const history = await getRelayedHistory();
      setRelayedTxs(history);
    } catch (err) {
      console.error('Error fetching relayed transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRelayedHistory();
  }, []);

  const totalGasCostUsd = relayedTxs.reduce((acc, tx) => acc + (tx.gasCostUsd || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>EIP-2771 META-TRANSACTION GAS SPONSORSHIP ENGINE</span>
          </div>
          <h2 className="text-xl font-bold text-white">Zero-Upfront Gas Relay Paymaster</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Oskayi integrates EIP-2771 trusted forwarder standards (Gelato / Biconomy / Defender). Vision owners sign an off-chain EIP-712 payload; the relayer pays the EVM gas fees upon successful arbitrage execution.
          </p>
        </div>

        <button
          onClick={fetchRelayedHistory}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-750 text-emerald-400 text-xs font-mono font-semibold rounded-xl border border-slate-700 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Fetching Relayer Logs...' : 'Refresh Relayer Logs'}</span>
        </button>
      </div>

      {/* Relayer Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="text-[10px] font-mono text-slate-500 uppercase">EIP-2771 Trusted Forwarder</div>
          <div className="text-sm font-bold font-mono text-emerald-400 truncate">0xB2b5841Dbe0B2122E9B4fF0764cEBF144F23d6a5</div>
          <div className="text-[11px] text-slate-400">Deployed on Chain {selectedChainId}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="text-[10px] font-mono text-slate-500 uppercase">Relayed Transactions</div>
          <div className="text-xl font-bold font-mono text-slate-100">{relayedTxs.length} Meta-Txs</div>
          <div className="text-[11px] text-slate-400">0 Gas Paid by Vision Owners</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="text-[10px] font-mono text-slate-500 uppercase">Total Gas Sponsored</div>
          <div className="text-xl font-bold font-mono text-emerald-400">${totalGasCostUsd.toFixed(2)} USD</div>
          <div className="text-[11px] text-slate-400">Underwritten by Oskayi Relayer Paymaster</div>
        </div>
      </div>

      {/* EIP-712 ForwardRequest Schema Inspection */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
          <Code className="w-4 h-4 text-emerald-400" />
          <span>EIP-712 Typed Data Structure (ForwardRequest)</span>
        </div>

        <pre className="bg-slate-950 p-4 rounded-xl border border-slate-850 font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed">
{`struct ForwardRequest {
    address from;         // Vision owner address
    address to;           // OskayiArbitrageExecutor contract
    uint256 value;        // Always 0 ETH
    uint256 gas;          // Max gas limit (e.g. 400,000)
    uint256 nonce;        // User EIP-2771 anti-replay nonce
    bytes data;           // Encoded executeOskayiFlashLoanArbitrage calldata
    uint256 validUntil;   // Expiration timestamp
}`}
        </pre>
      </div>

      {/* Relayer Transactions Ledger */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Relayed Meta-Transactions History</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {relayedTxs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-mono text-xs">
              No relayed meta-transactions recorded yet. Submit a gas-sponsored vision and execute arbitrage to trigger the relayer!
            </div>
          ) : (
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <tr>
                  <th className="px-6 py-3">Vision ID</th>
                  <th className="px-6 py-3">From Address</th>
                  <th className="px-6 py-3">Transaction Hash</th>
                  <th className="px-6 py-3">Gas Used</th>
                  <th className="px-6 py-3">Sponsored Cost</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {relayedTxs.map((tx, i) => (
                  <tr key={i} className="hover:bg-slate-850/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-emerald-400">{tx.visionId}</td>
                    <td className="px-6 py-4 text-slate-300">
                      {tx.fromAddress.slice(0, 6)}...{tx.fromAddress.slice(-4)}
                    </td>
                    <td className="px-6 py-4 text-cyan-400 underline truncate max-w-xs">
                      {tx.txHash}
                    </td>
                    <td className="px-6 py-4 text-slate-300">{tx.gasUsed} @ {tx.effectiveGasPriceGwei} Gwei</td>
                    <td className="px-6 py-4 text-emerald-400 font-bold">${tx.gasCostUsd.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className="flex items-center space-x-1.5 text-emerald-400 font-semibold text-[11px]">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Relayed & Sponsored</span>
                      </span>
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
