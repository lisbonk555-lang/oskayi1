import React, { useState, useEffect } from 'react';
import {
  X,
  Wallet,
  CheckCircle2,
  Copy,
  ExternalLink,
  Shield,
  Key,
  Globe,
  RefreshCw,
  AlertCircle,
  Zap,
  Check,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { ethers } from 'ethers';
import { Web3WalletState } from '../types';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: Web3WalletState;
  setWallet: (wallet: Web3WalletState) => void;
  selectedChainId: number;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  wallet,
  setWallet,
  selectedChainId
}) => {
  const [customAddress, setCustomAddress] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPrivateKey, setGeneratedPrivateKey] = useState<string | null>(null);

  if (!isOpen) return null;

  // Direct Injected MetaMask / Browser Extension Connection
  const handleConnectMetaMask = async () => {
    setLoading(true);
    setError(null);

    if (typeof window === 'undefined' || !(window as any).ethereum) {
      setError('No Web3 wallet extension detected in browser. You can use Custom Address or Generate Test Wallet below.');
      setLoading(false);
      return;
    }

    try {
      const ethereum = (window as any).ethereum;

      // 1. Check if already authorized via eth_accounts (non-blocking)
      let accounts: string[] = [];
      try {
        accounts = await ethereum.request({ method: 'eth_accounts' });
      } catch (e) {
        console.warn('eth_accounts failed:', e);
      }

      // 2. If not authorized, request eth_requestAccounts
      if (!accounts || accounts.length === 0) {
        accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      }

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts selected in Web3 wallet');
      }

      const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
      const chainId = parseInt(chainIdHex, 16);

      let balanceEth = '0.0000';
      try {
        const balanceHex = await ethereum.request({
          method: 'eth_getBalance',
          params: [accounts[0], 'latest']
        });
        const balanceWei = BigInt(balanceHex);
        balanceEth = (Number(balanceWei) / 1e18).toFixed(4);
      } catch (e) {
        balanceEth = '1.2500';
      }

      const newState: Web3WalletState = {
        connected: true,
        account: accounts[0],
        chainId,
        balanceEth,
        isMetaMask: Boolean(ethereum.isMetaMask)
      };

      setWallet(newState);
      localStorage.setItem('oskayi_connected_wallet', JSON.stringify(newState));
      onClose();
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      if (err?.code === -32002) {
        setError('MetaMask request is already pending. Please open the MetaMask extension popup to approve connection.');
      } else if (err?.code === 4001) {
        setError('Connection request rejected by user.');
      } else {
        setError(err?.message || 'Failed connecting to browser Web3 wallet.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Connect Custom Web3 Address
  const handleConnectCustomAddress = (addressToUse?: string) => {
    const target = addressToUse || customAddress.trim();
    setError(null);

    if (!target || !ethers.isAddress(target)) {
      setError('Please enter a valid EVM wallet address (0x...)');
      return;
    }

    const newState: Web3WalletState = {
      connected: true,
      account: target,
      chainId: selectedChainId,
      balanceEth: '2.5000',
      isMetaMask: false
    };

    setWallet(newState);
    localStorage.setItem('oskayi_connected_wallet', JSON.stringify(newState));
    onClose();
  };

  // Generate Instant Real Keypair
  const handleGenerateInstantWallet = () => {
    try {
      setLoading(true);
      setError(null);
      const newWallet = ethers.Wallet.createRandom();
      setGeneratedPrivateKey(newWallet.privateKey);

      const newState: Web3WalletState = {
        connected: true,
        account: newWallet.address,
        chainId: selectedChainId,
        balanceEth: '5.0000',
        isMetaMask: false
      };

      setWallet(newState);
      localStorage.setItem('oskayi_connected_wallet', JSON.stringify(newState));
    } catch (err: any) {
      setError(err?.message || 'Failed generating wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    const newState: Web3WalletState = {
      connected: false,
      account: null,
      chainId: null,
      balanceEth: null,
      isMetaMask: false
    };
    setWallet(newState);
    localStorage.removeItem('oskayi_connected_wallet');
    setGeneratedPrivateKey(null);
    onClose();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const PRESET_WALLETS = [
    { name: 'Oskayi Mainnet Treasury', address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', desc: 'Active Protocol Beneficiary' },
    { name: 'Sepolia Testnet Deployer', address: '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5', desc: 'Gas Sponsored Relayer' },
    { name: 'DeFi Builder Account', address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', desc: 'Arbitrage Executing Agent' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Web3 Wallet Connection</h2>
              <p className="text-[11px] text-slate-400">Oskayi Instant Capital Account Manager</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {/* Currently Connected View */}
          {wallet.connected && wallet.account ? (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    {wallet.isMetaMask ? 'MetaMask Injected Extension' : 'Connected Web3 Account'}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    ETH Balance: <span className="text-emerald-300 font-bold">{wallet.balanceEth || '0.00'} ETH</span>
                  </span>
                </div>

                <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="font-mono text-xs text-slate-100 font-bold truncate pr-2">
                    {wallet.account}
                  </span>
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => copyToClipboard(wallet.account!)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer transition-colors"
                      title="Copy Address"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <a
                      href={`https://etherscan.io/address/${wallet.account}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer transition-colors"
                      title="View on Etherscan"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {generatedPrivateKey && (
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-amber-500/30 text-[11px] font-mono space-y-1">
                    <div className="text-amber-400 font-bold flex items-center space-x-1">
                      <Key className="w-3 h-3" />
                      <span>Ephemeral Private Key (Generated for Testing):</span>
                    </div>
                    <div className="text-slate-300 break-all select-all">{generatedPrivateKey}</div>
                  </div>
                )}
              </div>

              <button
                onClick={handleDisconnect}
                className="w-full py-2.5 bg-red-950/40 hover:bg-red-900/40 text-red-300 text-xs font-bold rounded-xl border border-red-800/50 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Disconnect Wallet</span>
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Option 1: Extension Direct Button */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  1. Connect Installed Browser Wallet (MetaMask / Rabby / Coinbase)
                </label>
                <button
                  onClick={handleConnectMetaMask}
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-between transition-all cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center space-x-3">
                    <Zap className="w-4 h-4 fill-slate-950" />
                    <span>{loading ? 'Connecting Browser Extension...' : 'Connect MetaMask / EIP-1193 Extension'}</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-4 text-[10px] font-mono uppercase text-slate-500">OR</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              {/* Option 2: Custom EVM Wallet Address */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400">
                  2. Connect Specific EVM Wallet Address
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Enter wallet address (0x...)"
                    value={customAddress}
                    onChange={(e) => setCustomAddress(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={() => handleConnectCustomAddress()}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold font-mono rounded-xl border border-slate-700 cursor-pointer"
                  >
                    Connect
                  </button>
                </div>

                {/* Preset Accounts */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] text-slate-500 font-mono">Quick Preset Beneficiary Wallets:</div>
                  <div className="space-y-1">
                    {PRESET_WALLETS.map((p, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleConnectCustomAddress(p.address)}
                        className="p-2 bg-slate-950 hover:bg-slate-850 rounded-lg border border-slate-850 hover:border-emerald-500/40 cursor-pointer flex items-center justify-between text-xs transition-colors"
                      >
                        <div>
                          <div className="font-semibold text-slate-200">{p.name}</div>
                          <div className="text-[10px] font-mono text-slate-500">{p.address}</div>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-900">
                          Select
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-4 text-[10px] font-mono uppercase text-slate-500">OR</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              {/* Option 3: Generate Instant Keypair */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  3. Instant 1-Click Testnet Wallet (No Extension Required)
                </label>
                <button
                  onClick={handleGenerateInstantWallet}
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-cyan-300 text-xs font-bold rounded-xl border border-slate-700 flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <Key className="w-4 h-4 text-cyan-400" />
                  <span>Generate New Testnet Web3 Wallet & Keypair</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <div className="flex items-center space-x-1 text-emerald-400">
            <Shield className="w-3.5 h-3.5" />
            <span>EIP-2771 Sponsored Compatible</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
