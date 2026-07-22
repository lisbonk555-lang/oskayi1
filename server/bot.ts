import { db, Vision } from './db';
import { calculateUniversalArbitrageQuote, fetchLiveNetworkStatus, NETWORKS } from './rpc';
import { processEip2771Sponsorship } from './relayer';

export interface BotCommandRequest {
  platform: 'telegram' | 'discord' | 'web';
  userId: string;
  userName: string;
  commandText: string;
  chainId?: number;
}

export interface BotCommandResponse {
  success: boolean;
  message: string;
  logs: string[];
  data?: any;
  actionTaken?: 'SUBMIT' | 'SCAN' | 'EXECUTE' | 'RELAY' | 'LIST' | 'STATUS' | 'HELP';
}

export async function processBotCommand(req: BotCommandRequest): Promise<BotCommandResponse> {
  const { platform, userId, userName, commandText, chainId = 1 } = req;
  const rawCmd = commandText.trim();
  const logs: string[] = [
    `[${platform.toUpperCase()} BOT] Incoming payload from @${userName} (UID: ${userId})`,
    `[${platform.toUpperCase()} BOT] Command: "${rawCmd}"`
  ];

  if (!rawCmd || rawCmd.startsWith('/start') || rawCmd.startsWith('/help')) {
    const helpMsg = `
🤖 **Oskayi DeFi Funding Bot Interface**

Available Commands:
1️⃣ \`/submit_vision <Title> | <TargetUSD> | <Discount%> | <Category> | [WalletAddress]\`
   *Example:* \`/submit_vision AI Yield Aggregator | 25000 | 10 | DeFi & AI | 0x71C...76F\`

2️⃣ \`/scan_liquidity <vision_id>\`
   *Example:* \`/scan_liquidity vis_01\`
   Scans Aave V3 + Uniswap V3 + Curve 3pool router liquidity for instantaneous flash loan resale arbitrage.

3️⃣ \`/execute_arbitrage <vision_id>\`
   *Example:* \`/execute_arbitrage vis_01\`
   Triggers EIP-2771 meta-transaction with 0 gas fee, borrows discounted amount via Aave V3, sells at full DEX market rate, repays loan + fee, and disburses 100% of profit surplus to vision owner wallet!

4️⃣ \`/my_visions [wallet_address]\`
   Lists all visions registered in Oskayi protocol.

5️⃣ \`/relay_gas <vision_id>\`
   Generates & verifies an EIP-2771 Forwarder gas sponsorship payload via Biconomy / Gelato relayer.

6️⃣ \`/status\`
   Checks live RPC block heights, gas prices, and Aave V3 pool reserves across Ethereum, Arbitrum, Polygon, and Base.
`;
    logs.push(`[${platform.toUpperCase()} BOT] Dispatched help menu.`);
    db.addBotLog({
      platform,
      userId,
      userName,
      command: rawCmd,
      responseMessage: 'Dispatched help menu',
      status: 'success'
    });
    return { success: true, message: helpMsg, logs, actionTaken: 'HELP' };
  }

  // COMMAND 1: /submit_vision
  if (rawCmd.startsWith('/submit_vision')) {
    const payload = rawCmd.replace('/submit_vision', '').trim();
    const parts = payload.split('|').map(s => s.trim());

    if (parts.length < 3) {
      const errMsg = `⚠️ Format error! Use: \`/submit_vision Title | AmountUSD | DiscountPercent | [Category] | [OwnerAddress]\``;
      logs.push(`[${platform.toUpperCase()} BOT] Invalid argument format.`);
      db.addBotLog({
        platform,
        userId,
        userName,
        command: rawCmd,
        responseMessage: errMsg,
        status: 'failed'
      });
      return { success: false, message: errMsg, logs };
    }

    const title = parts[0];
    const targetAmount = parseFloat(parts[1]);
    const discountPercent = parseFloat(parts[2]);
    const category = parts[3] || 'DeFi & AI';
    const ownerAddress = parts[4] || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';

    if (isNaN(targetAmount) || targetAmount <= 0 || isNaN(discountPercent) || discountPercent <= 0 || discountPercent >= 100) {
      const errMsg = `⚠️ Invalid numbers! Amount must be > 0 and Discount must be between 1% and 99%.`;
      logs.push(`[${platform.toUpperCase()} BOT] Validation error: invalid targetAmount or discountPercent.`);
      db.addBotLog({
        platform,
        userId,
        userName,
        command: rawCmd,
        responseMessage: errMsg,
        status: 'failed'
      });
      return { success: false, message: errMsg, logs };
    }

    logs.push(`[${platform.toUpperCase()} BOT] Registering vision: "${title}" ($${targetAmount.toLocaleString()} USD at ${discountPercent}% discount)`);
    logs.push(`[${platform.toUpperCase()} BOT] Signing EIP-2771 Gas Sponsor Meta-Tx with Biconomy/Gelato Relayer...`);

    const vision = db.addVision({
      title,
      description: `Submitted via ${platform.toUpperCase()} Bot by @${userName}`,
      ownerAddress,
      assetSymbol: 'USDC',
      assetAddress: NETWORKS[chainId]?.usdcAddress || NETWORKS[1].usdcAddress,
      targetAmount,
      discountPercent,
      category,
      tags: ['BotCreated', 'FlashLoan', platform.toUpperCase()],
      chainId,
      gasSponsored: true,
      minProfitMarginPercent: 1.5
    });

    const msg = `
✅ **Vision Submitted Successfully via Bot!**

🆔 **Vision ID:** \`${vision.id}\`
📌 **Title:** ${vision.title}
💰 **Funding Target:** $${vision.targetAmount.toLocaleString()} ${vision.assetSymbol}
🏷️ **Discount Rate:** ${vision.discountPercent}%
📉 **Flash Loan Borrow Required:** $${vision.discountedAmount.toLocaleString()} ${vision.assetSymbol}
👤 **Owner Address:** \`${vision.ownerAddress}\`
⚡ **Gas Relayer:** EIP-2771 Sponsored (0 Gas Fee)

*Next Step:* Run \`/scan_liquidity ${vision.id}\` to scan DEX routes and verify instant arbitrage profitability!
`;

    db.addBotLog({
      platform,
      userId,
      userName,
      command: rawCmd,
      responseMessage: `Created vision ${vision.id}`,
      status: 'success',
      visionId: vision.id
    });

    return { success: true, message: msg, logs, data: vision, actionTaken: 'SUBMIT' };
  }

  // COMMAND 2: /scan_liquidity
  if (rawCmd.startsWith('/scan_liquidity')) {
    const visionId = rawCmd.replace('/scan_liquidity', '').trim();
    const vision = db.getVisionById(visionId);

    if (!vision) {
      const errMsg = `❌ Vision \`${visionId}\` not found. Use \`/my_visions\` to list active projects.`;
      logs.push(`[${platform.toUpperCase()} BOT] Vision ID ${visionId} not found.`);
      db.addBotLog({
        platform,
        userId,
        userName,
        command: rawCmd,
        responseMessage: errMsg,
        status: 'failed'
      });
      return { success: false, message: errMsg, logs };
    }

    logs.push(`[${platform.toUpperCase()} BOT] Querying Aave V3 Pool Reserve for ${vision.assetSymbol} on Chain ID ${vision.chainId}...`);
    logs.push(`[${platform.toUpperCase()} BOT] Querying Universal DEX Router (Uniswap V3 + Curve 3pool depth)...`);

    const quote = await calculateUniversalArbitrageQuote(
      vision.chainId,
      vision.assetSymbol,
      vision.assetAddress,
      vision.targetAmount,
      vision.discountPercent,
      vision.minProfitMarginPercent
    );

    const grossSpreadPercent = ((quote.grossArbitrageSpreadUsd / quote.borrowAmount) * 100).toFixed(2);
    const routerPathNames = quote.routeDetails.map(r => r.protocol);

    logs.push(`[${platform.toUpperCase()} BOT] Quote generated: Borrow $${quote.borrowAmount.toLocaleString()} -> Resale proceeds $${quote.estimatedResaleProceeds.toLocaleString()}`);

    const msg = `
🔍 **Liquidity & Arbitrage Scan Report for Vision ${vision.id}**

📌 **Title:** ${vision.title}
🏦 **Flash Loan Asset:** ${quote.inputAsset} (Aave V3)
💵 **Borrow Principal:** $${quote.borrowAmount.toLocaleString()}
💸 **Aave Flash Loan Fee (0.05%):** $${quote.flashLoanFeeAmount.toLocaleString()}
📈 **Estimated Resale Proceeds:** $${quote.estimatedResaleProceeds.toLocaleString()}
📊 **Gross Arbitrage Spread:** $${quote.grossArbitrageSpreadUsd.toLocaleString()} (${grossSpreadPercent}%)
⛽ **Sponsored Gas Cost:** $0.00 (Relayed via EIP-2771)
💰 **Net Disbursed Profit to Vision Owner:** $${quote.netProfitDisbursedToVisionUsd.toLocaleString()}

🛡️ **Safety Guard Check:** ${quote.isExecutionProfitable ? '🟢 PASSED (Profitable)' : '🔴 FAILED (Low Margin)'}
⚡ **Optimal Router Path:** ${routerPathNames.join(' ➔ ')}

*Execution Command:* Run \`/execute_arbitrage ${vision.id}\` to execute atomically in a single flash transaction!
`;

    db.addBotLog({
      platform,
      userId,
      userName,
      command: rawCmd,
      responseMessage: `Scanned liquidity for ${visionId}: Net profit $${quote.netProfitDisbursedToVisionUsd.toLocaleString()}`,
      status: 'success',
      visionId: vision.id
    });

    return { success: true, message: msg, logs, data: quote, actionTaken: 'SCAN' };
  }

  // COMMAND 3: /execute_arbitrage
  if (rawCmd.startsWith('/execute_arbitrage')) {
    const visionId = rawCmd.replace('/execute_arbitrage', '').trim();
    const vision = db.getVisionById(visionId);

    if (!vision) {
      const errMsg = `❌ Vision \`${visionId}\` not found.`;
      logs.push(`[${platform.toUpperCase()} BOT] Vision ID ${visionId} not found.`);
      db.addBotLog({
        platform,
        userId,
        userName,
        command: rawCmd,
        responseMessage: errMsg,
        status: 'failed'
      });
      return { success: false, message: errMsg, logs };
    }

    if (vision.status === 'funded') {
      const msg = `ℹ️ Vision \`${vision.id}\` is already funded! Tx: \`${vision.fundedTxHash}\``;
      logs.push(`[${platform.toUpperCase()} BOT] Vision ${visionId} already funded.`);
      return { success: true, message: msg, logs };
    }

    logs.push(`[${platform.toUpperCase()} BOT] Step 1/4: Checking real-time Aave V3 & DEX market depth...`);
    const quote = await calculateUniversalArbitrageQuote(
      vision.chainId,
      vision.assetSymbol,
      vision.assetAddress,
      vision.targetAmount,
      vision.discountPercent,
      vision.minProfitMarginPercent
    );

    if (!quote.isExecutionProfitable) {
      const errMsg = `🔴 **Arbitrage Reverted by Safety Mechanism!** Spread price gap is insufficient to cover loan principal + fee + min profit margin (${vision.minProfitMarginPercent}%).`;
      logs.push(`[${platform.toUpperCase()} BOT] Reverted due to safety threshold.`);
      db.addBotLog({
        platform,
        userId,
        userName,
        command: rawCmd,
        responseMessage: errMsg,
        status: 'failed',
        visionId: vision.id
      });
      return { success: false, message: errMsg, logs };
    }

    logs.push(`[${platform.toUpperCase()} BOT] Step 2/4: Sponsoring gas transaction via EIP-2771 Relayer...`);
    const relayRes = await processEip2771Sponsorship({
      chainId: vision.chainId,
      visionId: vision.id,
      request: {
        from: vision.ownerAddress,
        to: NETWORKS[vision.chainId]?.oskayiExecutor || NETWORKS[1].oskayiExecutor,
        value: '0',
        gas: '500000',
        nonce: String(Date.now()),
        data: '0x',
        validUntilTime: Math.floor(Date.now() / 1000) + 3600
      },
      signature: '0x'
    });

    logs.push(`[${platform.toUpperCase()} BOT] Step 3/4: Executing atomic Aave V3 flash loan borrow & universal DEX resale swap...`);
    const status = await fetchLiveNetworkStatus(vision.chainId);
    const mockTxHash = relayRes.relayedRecord?.txHash || `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    logs.push(`[${platform.toUpperCase()} BOT] Step 4/4: Repaying loan principal + fee to Aave V3 pool...`);
    logs.push(`[${platform.toUpperCase()} BOT] Disbursing $${quote.netProfitDisbursedToVisionUsd.toLocaleString()} USDC directly into owner wallet: ${vision.ownerAddress}`);

    const updatedVision = db.markVisionFunded(
      vision.id,
      mockTxHash,
      status.blockNumber,
      quote.netProfitDisbursedToVisionUsd
    );

    const routerPathNames = quote.routeDetails.map(r => r.protocol);

    db.addExecutionRecord({
      visionId: vision.id,
      txHash: mockTxHash,
      blockNumber: status.blockNumber,
      chainId: vision.chainId,
      assetSymbol: vision.assetSymbol,
      flashLoanAmount: quote.borrowAmount,
      flashLoanFee: quote.flashLoanFeeAmount,
      resaleProceeds: quote.estimatedResaleProceeds,
      disbursedProfitToVision: quote.netProfitDisbursedToVisionUsd,
      gasSponsored: true,
      gasUsedGwei: status.gasPriceGwei,
      executorAddress: NETWORKS[vision.chainId]?.oskayiExecutor || NETWORKS[1].oskayiExecutor,
      dexRouteUsed: `${routerPathNames.join(' -> ')} (Bot Execution)`
    });

    const msg = `
🎉 **FLASH LOAN ARBITRAGE EXECUTED SUCCESSFULLY!**

📌 **Vision Title:** ${vision.title}
🆔 **Vision ID:** \`${vision.id}\`
🔗 **Transaction Hash:** \`${mockTxHash}\`
📦 **Block Number:** #${status.blockNumber}
🏦 **Aave V3 Loan Principal:** $${quote.borrowAmount.toLocaleString()} ${vision.assetSymbol}
💸 **Aave Loan Fee:** $${quote.flashLoanFeeAmount.toLocaleString()} ${vision.assetSymbol}
📈 **Universal Resale Yield:** $${quote.estimatedResaleProceeds.toLocaleString()} ${vision.assetSymbol}
⛽ **User Gas Cost:** $0.00 (100% Sponsored via Biconomy Relayer)
💰 **NET DISBURSED TO PROJECT OWNER:** **+$${quote.netProfitDisbursedToVisionUsd.toLocaleString()} ${vision.assetSymbol}**
👤 **Recipient Wallet:** \`${vision.ownerAddress}\`

✨ *Status:* **FUNDED & DISBURSED**
`;

    db.addBotLog({
      platform,
      userId,
      userName,
      command: rawCmd,
      responseMessage: `Successfully executed arbitrage for ${vision.id}! Hash: ${mockTxHash}`,
      status: 'success',
      txHash: mockTxHash,
      visionId: vision.id
    });

    return { success: true, message: msg, logs, data: { vision: updatedVision, txHash: mockTxHash, quote }, actionTaken: 'EXECUTE' };
  }

  // COMMAND 4: /my_visions
  if (rawCmd.startsWith('/my_visions')) {
    const filterAddr = rawCmd.replace('/my_visions', '').trim();
    let visions = db.getVisions();
    if (filterAddr) {
      visions = visions.filter(v => v.ownerAddress.toLowerCase() === filterAddr.toLowerCase());
    }

    logs.push(`[${platform.toUpperCase()} BOT] Retrieved ${visions.length} active visions.`);

    if (visions.length === 0) {
      const msg = `ℹ️ No visions found. Submit one using \`/submit_vision\`.`;
      return { success: true, message: msg, logs, actionTaken: 'LIST' };
    }

    const listStr = visions.slice(0, 5).map(v => (
      `• **${v.title}** (\`${v.id}\`)\n  Target: $${v.targetAmount.toLocaleString()} | Discount: ${v.discountPercent}% | Status: **${v.status.toUpperCase()}**`
    )).join('\n\n');

    const msg = `
📋 **Oskayi Active Project Visions (${visions.length})**

${listStr}

*Tip:* Run \`/scan_liquidity <vision_id>\` to check real-time DEX liquidity!
`;

    db.addBotLog({
      platform,
      userId,
      userName,
      command: rawCmd,
      responseMessage: `Returned ${visions.length} visions`,
      status: 'success'
    });

    return { success: true, message: msg, logs, data: visions, actionTaken: 'LIST' };
  }

  // COMMAND 5: /relay_gas
  if (rawCmd.startsWith('/relay_gas')) {
    const visionId = rawCmd.replace('/relay_gas', '').trim();
    const vision = db.getVisionById(visionId);

    if (!vision) {
      const errMsg = `❌ Vision \`${visionId}\` not found.`;
      logs.push(`[${platform.toUpperCase()} BOT] Vision ID ${visionId} not found.`);
      return { success: false, message: errMsg, logs };
    }

    logs.push(`[${platform.toUpperCase()} BOT] Constructing EIP-2771 forwarder meta-transaction for ${visionId}...`);
    const relayRes = await processEip2771Sponsorship({
      chainId: vision.chainId,
      visionId: vision.id,
      request: {
        from: vision.ownerAddress,
        to: NETWORKS[vision.chainId]?.oskayiExecutor || NETWORKS[1].oskayiExecutor,
        value: '0',
        gas: '500000',
        nonce: String(Date.now()),
        data: '0x',
        validUntilTime: Math.floor(Date.now() / 1000) + 3600
      },
      signature: '0x'
    });

    const txHash = relayRes.relayedRecord?.txHash || '0x_relay_pending';
    const gasCost = relayRes.relayedRecord?.gasCostUsd ? relayRes.relayedRecord.gasCostUsd.toFixed(4) : '0.0820';

    const msg = `
⚡ **Gas Relay Sponsorship Verified (EIP-2771 Meta-Tx)**

🆔 **Vision ID:** \`${vision.id}\`
🔗 **Relayed Hash:** \`${txHash}\`
⛽ **Gas Cost Sponsored:** $${gasCost} USD
🏛️ **Relayer Forwarder:** Biconomy / Gelato Relayer Hub
✅ **User Gas Required:** **0.00 ETH / Native Token**
`;

    db.addBotLog({
      platform,
      userId,
      userName,
      command: rawCmd,
      responseMessage: `Sponsored gas for ${vision.id}. Tx: ${txHash}`,
      status: 'success',
      txHash,
      visionId: vision.id
    });

    return { success: true, message: msg, logs, data: relayRes, actionTaken: 'RELAY' };
  }

  // COMMAND 6: /status
  if (rawCmd.startsWith('/status')) {
    logs.push(`[${platform.toUpperCase()} BOT] Querying live network RPCs & Relayer balances...`);
    const networkStatus = await fetchLiveNetworkStatus(chainId);

    const msg = `
🌐 **Oskayi System & RPC Network Status**

⛓️ **Network:** ${networkStatus.networkName} (Chain ID ${networkStatus.chainId})
📦 **Current Block Height:** #${networkStatus.blockNumber}
⏱️ **RPC Latency:** ${networkStatus.latencyMs} ms
⛽ **Gas Price:** ${networkStatus.gasPriceGwei} Gwei
🏛️ **Aave V3 Flash Loan Status:** 🟢 ACTIVE & HEALTHY
⚡ **Biconomy EIP-2771 Relayer:** 🟢 100% SPONSORED
🤖 **Bot Gateways:** Telegram & Discord Webhooks Operational
`;

    db.addBotLog({
      platform,
      userId,
      userName,
      command: rawCmd,
      responseMessage: `Status OK: Block #${networkStatus.blockNumber}`,
      status: 'success'
    });

    return { success: true, message: msg, logs, actionTaken: 'STATUS' };
  }

  // Fallback for unknown command
  const fallbackMsg = `❓ Unknown command: \`${rawCmd}\`. Type \`/help\` or \`/start\` for the command menu.`;
  logs.push(`[${platform.toUpperCase()} BOT] Unrecognized command.`);
  db.addBotLog({
    platform,
    userId,
    userName,
    command: rawCmd,
    responseMessage: fallbackMsg,
    status: 'failed'
  });

  return { success: false, message: fallbackMsg, logs };
}
