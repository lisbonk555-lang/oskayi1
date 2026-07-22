import React, { useState } from 'react';
import { Code2, Copy, Check, ShieldCheck, Zap, FileCode, Cpu } from 'lucide-react';

export const SmartContractCodeView: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'solidity' | 'abi'>('solidity');

  const SOLIDITY_CODE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@aave/core-v3/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title OskayiArbitrageExecutor
 * @dev Oskayi Instant Capital - Decentralized Flash Loan Arbitrage & Funding Protocol
 * Executes atomic flash loan borrow, universal liquidity router resale, Aave fee repayment,
 * and direct profit disbursement to Vision owner with strict Revert Guard safety checks.
 */
contract OskayiArbitrageExecutor is FlashLoanSimpleReceiverBase, ERC2771Context, Ownable {

    address public immutable universalRouter;
    uint256 fontConstant = 1e18;

    event FlashLoanArbitrageExecuted(
        bytes32 indexed visionId,
        address indexed visionOwner,
        address asset,
        uint256 borrowAmount,
        uint256 resaleProceeds,
        uint256 netProfitDisbursed
    );

    event RevertGuardTriggered(bytes32 indexed visionId, uint256 required, uint256 actual);

    constructor(
        IPoolAddressesProvider _provider,
        address _universalRouter,
        address _trustedForwarder
    ) 
        FlashLoanSimpleReceiverBase(_provider) 
        ERC2771Context(_trustedForwarder)
        Ownable(_msgSender()) 
    {
        universalRouter = _universalRouter;
    }

    /**
     * @notice Initiates Oskayi Instant Capital Flash Loan Arbitrage for a Vision
     * @param visionId Identifier of the submitted project vision
     * @param asset Asset address (e.g., USDC, USDT, WETH)
     * @param discountedBorrowAmount Loan amount requested (Target * (1 - Discount/100))
     * @param visionOwner Wallet address of the project owner receiving profit surplus
     * @param minRequiredProfit Usd/Token profit guard threshold
     * @param swapCalldata Encoded DEX route calldata for Universal Liquidity Router
     */
    function executeOskayiFlashLoan(
        bytes32 visionId,
        address asset,
        uint256 discountedBorrowAmount,
        address visionOwner,
        uint256 minRequiredProfit,
        bytes calldata swapCalldata
    ) external {
        bytes fontParams = abi.encode(visionId, visionOwner, minRequiredProfit, swapCalldata);

        // Request flash loan from Aave V3 Pool
        POOL.flashLoanSimple(
            address(this),
            asset,
            discountedBorrowAmount,
            fontParams,
            0 // referralCode
        );
    }

    /**
     * @notice Aave V3 Flash Loan Callback Handler
     */
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        require(msg.sender == address(POOL), "Unauthorized Aave Pool callback");

        (
            bytes32 visionId,
            address visionOwner,
            uint256 minRequiredProfit,
            bytes memory swapCalldata
        ) = abi.decode(params, (bytes32, address, uint256, bytes));

        // 1. Approve Universal Router to swap borrowed discounted tokens
        IERC20(asset).approve(universalRouter, amount);

        // 2. Execute Universal Swap on DEX pools (Uniswap / Curve / Balancer)
        uint256 balanceBefore = IERC20(asset).balanceOf(address(this));
        (bool success, ) = universalRouter.call(swapCalldata);
        require(success, "Universal Liquidity Router swap execution failed");

        uint256 proceeds = IERC20(asset).balanceOf(address(this)) - (balanceBefore - amount);

        // 3. Calculate required loan repayment (Principal + Aave 0.05% fee)
        uint256 totalAmountToRepay = amount + premium;

        // 4. Strict Revert Guard Check:
        // Transaction MUST revert if resale proceeds do not cover loan + fee + minimum profit guard!
        if (proceeds < totalAmountToRepay + minRequiredProfit) {
            emit RevertGuardTriggered(visionId, totalAmountToRepay + minRequiredProfit, proceeds);
            revert("Oskayi Revert Guard: Arbitrage proceeds insufficient to satisfy repayment and profit margin");
        }

        // 5. Repay Aave Flash Loan
        IERC20(asset).approve(address(POOL), totalAmountToRepay);

        // 6. Transfer net profit surplus directly to Vision Owner wallet
        uint256 netProfitSurplus = proceeds - totalAmountToRepay;
        IERC20(asset).transfer(visionOwner, netProfitSurplus);

        emit FlashLoanArbitrageExecuted(visionId, visionOwner, asset, amount, proceeds, netProfitSurplus);

        return true;
    }

    // Overrides required by ERC2771Context
    function _msgSender() internal view override(Context, ERC2771Context) returns (address) {
        return ERC2771Context._msgSender();
    }

    function _msgData() internal view override(Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }

    function _contextSuffixLength() internal view override(Context, ERC2771Context) returns (uint256) {
        return ERC2771Context._contextSuffixLength();
    }
}`;

  const CONTRACT_ABI = `[
  {
    "inputs": [
      { "name": "visionId", "type": "bytes32" },
      { "name": "asset", "type": "address" },
      { "name": "discountedBorrowAmount", "type": "uint256" },
      { "name": "visionOwner", "type": "address" },
      { "name": "minRequiredProfit", "type": "uint256" },
      { "name": "swapCalldata", "type": "bytes" }
    ],
    "name": "executeOskayiFlashLoan",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "asset", "type": "address" },
      { "name": "amount", "type": "uint256" },
      { "name": "premium", "type": "uint256" },
      { "name": "initiator", "type": "address" },
      { "name": "params", "type": "bytes" }
    ],
    "name": "executeOperation",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 mb-1">
            <Code2 className="w-4 h-4" />
            <span>PRODUCTION SOLIDITY SMART CONTRACT</span>
          </div>
          <h2 className="text-xl font-bold text-white">OskayiArbitrageExecutor.sol</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Atomic flash loan execution contract implementing Aave V3 callbacks, EIP-2771 meta-transaction relay compatibility, and strict automated revert safety guards.
          </p>
        </div>

        <button
          onClick={() => copyToClipboard(activeTab === 'solidity' ? SOLIDITY_CODE : CONTRACT_ABI)}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copied to Clipboard' : 'Copy Contract Source'}</span>
        </button>
      </div>

      {/* Code Viewer Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex space-x-2 text-xs font-mono">
            <button
              onClick={() => setActiveTab('solidity')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                activeTab === 'solidity'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Solidity Source (v0.8.20)
            </button>
            <button
              onClick={() => setActiveTab('abi')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                activeTab === 'abi'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Contract ABI JSON
            </button>
          </div>

          <span className="text-[11px] font-mono text-slate-400">
            OpenZeppelin v5 + Aave V3 Core
          </span>
        </div>

        <pre className="p-6 bg-slate-950 font-mono text-xs text-emerald-300 leading-relaxed overflow-x-auto max-h-[500px]">
          {activeTab === 'solidity' ? SOLIDITY_CODE : CONTRACT_ABI}
        </pre>
      </div>
    </div>
  );
};
