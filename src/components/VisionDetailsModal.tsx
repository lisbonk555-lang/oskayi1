import React, { useState, useEffect } from 'react';
import {
  X,
  Zap,
  ShieldCheck,
  Cpu,
  TrendingUp,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Play,
  FileCode2,
  Copy,
  ExternalLink,
  Coins
} from 'lucide-react';
import { Vision, UniversalRouteQuote, SimulationResult, Web3WalletState } from '../types';
import { getArbitrageQuote, simulateArbitrage, executeArbitrage, relaySponsorTx } from '../services/api';

interface VisionDetailsModalProps {
  vision: Vision | null;
  isOpen: boolean;
  onClose: () => void;
  onVisionUpdated: () => void;
  wallet: Web3WalletState;
}

export const VisionDetailsModal: React.FC<VisionDetailsModalProps> = ({
  vision,
  isOpen,
  onClose,
  onVisionUpdated,
  wallet
}) => {
  const [quote, setQuote] = useState<UniversalRouteQuote | null>(null);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [loadingSim, setLoadingSim] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [relaySigned, setRelaySigned] = useState(false);
  const [execSuccess, setExecSuccess] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (vision && isOpen) {
      loadQuoteAndSim();
    } else {
      setQuote(null);
      setSimulation(null);
      setExecSuccess(null);
      setError(null);
    }
  }, [vision, isOpen]);

  if (!isOpen || !vision) return null;

  const loadQuoteAndSim = async () => {
    try {
      setLoadingQuote(true);
      setError(null);
      const q = await getArbitrageQuote({
        chainId: vision.chainId,
        assetSymbol: vision.assetSymbol,
        assetAddress: vision.assetAddress,
        targetAmount: vision.targetAmount,
        discountPercent: vision.discountPercent,
        minProfitMarginPercent: vision.minProfitMarginPercent
      });
      setQuote(q);

      setLoadingSim(true);
      const sim = await simulateArbitrage({
        chainId: vision.chainId,
        visionId: vision.id,
        userAddress: wallet.account || vision.ownerAddress
      });
      setSimulation(sim);
    } catch (err: any) {
      setError(err?.message || 'Failed to calculate quote or simulation');
    } finally {
      setLoadingQuote(false);
      setLoadingSim(false);
    }
  };

  const handleExecuteArbitrage = async () => {
    try {
      setExecuting(true);
      setError(null);

      // If gas sponsored, process EIP-2771 sponsorship first
      if (vision.gasSponsored) {
        await relaySponsorTx({
          chainId: vision.chainId,
          visionId: vision.id,
          request: {
            from: wallet.account || vision.ownerAddress,
            to: '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5',
            value: '0',
            gas: '400000',
            nonce: String(Math.floor(Math.random() * 100000)),
            data: '0x323c218d',
            validUntilTime: Math.floor(Date.now() / 1000) + 3600
          },
          signature: '0x' + Array.from({ length: 130 }, () => 'a').join('')
        });
        setRelaySigned(true);
      }

      // Execute on-chain arbitrage cycle
      const result = await executeArbitrage({
        visionId: vision.id,
        chainId: vision.chainId,
        userAddress: wallet.account || vision.ownerAddress
      });

      setExecSuccess(result);
      onVisionUpdated();
    } catch (err: any) {
      setError(err?.message || 'Arbitrage execution failed');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 p-0.5">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white line-clamp-1">{vision.title}</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  ID: {vision.id}
                </span>
              </div>
              <p className="text-xs text-slate-400">Owner: <span className="font-mono text-emerald-300">{vision.ownerAddress}</span></p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-4 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-200 flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <div className="font-bold">Execution Safety Guard Error</div>
                <div>{error}</div>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {execSuccess && (
            <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-200 space-y-2">
              <div className="flex items-center space-x-2 text-sm font-bold text-emerald-400">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Arbitrage Execution & Profit Disbursement Completed!</span>
              </div>
              <div className="font-mono space-y-1 text-slate-300">
                <div>Transaction Hash: <a href="#" className="text-emerald-300 underline font-semibold">{execSuccess.executionRecord.txHash}</a></div>
                <div>Block Height: #{execSuccess.executionRecord.blockNumber}</div>
                <div>Flash Loan Borrowed: ${execSuccess.executionRecord.flashLoanAmount.toLocaleString()} {vision.assetSymbol}</div>
                <div>Surplus Profit Disbursed to Vision Owner: <span className="text-emerald-400 font-bold">${execSuccess.executionRecord.disbursedProfitToVision.toLocaleString()} {vision.assetSymbol}</span></div>
              </div>
            </div>
          )}

          {/* Oskayi Arbitrage Mechanism Blueprint */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
            <div className="space-y-1">
              <div className="text-[10px] uppercase font-mono text-slate-500">Target Needed</div>
              <div className="text-base font-bold font-mono text-slate-100">${vision.targetAmount.toLocaleString()} {vision.assetSymbol}</div>
              <div className="text-[10px] text-slate-400">100% Project Funding</div>
            </div>

            <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-850 pt-2 md:pt-0 md:pl-3">
              <div className="text-[10px] uppercase font-mono text-slate-500">Flash Loan Borrow</div>
              <div className="text-base font-bold font-mono text-emerald-400">${vision.discountedAmount.toLocaleString()} {vision.assetSymbol}</div>
              <div className="text-[10px] text-emerald-300">{vision.discountPercent}% Discount Rate</div>
            </div>

            <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-850 pt-2 md:pt-0 md:pl-3">
              <div className="text-[10px] uppercase font-mono text-slate-500">Universal Resale Proceeds</div>
              <div className="text-base font-bold font-mono text-cyan-400">${quote ? quote.estimatedResaleProceeds.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '...'} {vision.assetSymbol}</div>
              <div className="text-[10px] text-cyan-300">Resold to DEX Pools</div>
            </div>

            <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-850 pt-2 md:pt-0 md:pl-3">
              <div className="text-[10px] uppercase font-mono text-slate-500">Disbursed Profit</div>
              <div className="text-base font-bold font-mono text-emerald-400">${quote ? quote.netProfitDisbursedToVisionUsd.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '...'} {vision.assetSymbol}</div>
              <div className="text-[10px] text-emerald-300">To Vision Owner Wallet</div>
            </div>
          </div>

          {/* Detailed Universal Router Route Breakdown */}
          {quote && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Universal Liquidity Router Execution Route</span>
                </div>
                <div className="flex items-center space-x-2 text-[11px] font-mono">
                  <span className="text-slate-400">Revert Safety Guard:</span>
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    quote.revertGuardStatus === 'PASSED'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-red-950 text-red-400 border border-red-800'
                  }`}>
                    {quote.revertGuardStatus}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {quote.routeDetails.map((rt, idx) => (
                  <div key={idx} className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs font-mono space-y-1">
                    <div className="flex items-center justify-between text-slate-300 font-semibold">
                      <span>{rt.protocol}</span>
                      <span className="text-emerald-400">{rt.percentage}%</span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">Pool: {rt.dexAddress}</div>
                    <div className="text-[10px] text-slate-400">Effective Rate: ${rt.effectivePriceUsd}</div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-850 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400">
                <div>Flash Loan Fee (Aave V3): <span className="text-slate-200">${quote.flashLoanFeeAmount.toFixed(2)}</span></div>
                <div>Slippage Tolerance: <span className="text-slate-200">{quote.slippagePercent}%</span></div>
                <div>Gas Estimate: <span className="text-slate-200">{quote.estimatedGasCostGwei} Gwei (~${quote.estimatedGasCostUsd.toFixed(2)})</span></div>
              </div>
            </div>
          )}

          {/* EVM eth_call Static Call Simulation Terminal */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="font-bold">EVM RPC eth_call Simulation Output</span>
              </div>
              {simulation && (
                <span className="text-[10px] text-slate-400">Executed @ Block #{simulation.blockNumber}</span>
              )}
            </div>

            <div className="bg-slate-900 p-3 rounded-lg border border-slate-850 font-mono text-[11px] text-emerald-400 space-y-1 overflow-x-auto max-h-36">
              {loadingSim ? (
                <div className="text-slate-500 animate-pulse">Running eth_call static dry-run on EVM RPC provider...</div>
              ) : simulation ? (
                <>
                  <div className="text-slate-400">[RPC] Result Status: <span className="text-emerald-300 font-bold">{simulation.success ? 'SUCCESS (0x1)' : 'REVERTED'}</span></div>
                  <div className="text-slate-400">[RPC] Gas Consumed: <span className="text-slate-200">{simulation.gasUsed.toLocaleString()} units</span></div>
                  {simulation.logs.map((log, i) => (
                    <div key={i} className="text-slate-300">{log}</div>
                  ))}
                </>
              ) : (
                <div className="text-slate-500">No simulation available</div>
              )}
            </div>
          </div>

          {/* EIP-2771 Gas Sponsorship Meta-Transaction Status */}
          {vision.gasSponsored && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center space-x-2 font-bold text-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>EIP-2771 Forwarder & Relayer Gas Sponsorship</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Upon execution, an EIP-712 payload <code className="bg-slate-900 text-emerald-300 px-1 py-0.5 rounded">ForwardRequest</code> is submitted to the Oskayi Relayer network.
                Gas fees (~{quote?.estimatedGasCostGwei || '25'} Gwei) will be 100% sponsored by Gelato/Biconomy paymaster.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer / Execution Trigger */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>

          {vision.status === 'funded' ? (
            <div className="text-xs font-mono text-emerald-400 font-bold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Vision Already Funded & Profit Disbursed</span>
            </div>
          ) : (
            <button
              onClick={handleExecuteArbitrage}
              disabled={executing || (quote && !quote.isExecutionProfitable)}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 text-xs font-bold rounded-lg transition-all shadow-lg shadow-emerald-950/50 flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>{executing ? 'Executing On-Chain Arbitrage...' : 'Execute Instant Capital Arbitrage'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
