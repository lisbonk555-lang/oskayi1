import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import {
  fetchLiveNetworkStatus,
  fetchAaveReserveData,
  calculateUniversalArbitrageQuote,
  simulateEthCall,
  NETWORKS
} from './server/rpc';
import { processEip2771Sponsorship } from './server/relayer';
import { processBotCommand } from './server/bot';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Get all visions
  app.get('/api/visions', (_req, res) => {
    const visions = db.getVisions();
    res.json({ visions });
  });

  // Get single vision by ID
  app.get('/api/visions/:id', (req, res) => {
    const vision = db.getVisionById(req.params.id);
    if (!vision) {
      return res.status(404).json({ error: 'Vision not found' });
    }
    res.json({ vision });
  });

  // Submit a new vision
  app.post('/api/visions', (req, res) => {
    const {
      title,
      description,
      ownerAddress,
      assetSymbol,
      assetAddress,
      targetAmount,
      discountPercent,
      category,
      tags,
      chainId,
      gasSponsored,
      minProfitMarginPercent
    } = req.body;

    if (!title || !ownerAddress || !targetAmount || !discountPercent) {
      return res.status(400).json({ error: 'Missing required vision parameters' });
    }

    const vision = db.addVision({
      title,
      description: description || '',
      ownerAddress,
      assetSymbol: assetSymbol || 'USDC',
      assetAddress: assetAddress || '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      targetAmount: Number(targetAmount),
      discountPercent: Number(discountPercent),
      category: category || 'DeFi',
      tags: Array.isArray(tags) ? tags : ['FlashLoan', 'DeFi'],
      chainId: Number(chainId) || 1,
      gasSponsored: Boolean(gasSponsored),
      minProfitMarginPercent: Number(minProfitMarginPercent) || 1.5
    });

    res.status(201).json({ vision });
  });

  // Live RPC status across supported networks
  app.get('/api/rpc/status', async (req, res) => {
    const chainId = req.query.chainId ? Number(req.query.chainId) : 1;
    const networks = [1, 42161, 137, 8453];

    try {
      if (req.query.all === 'true') {
        const statuses = await Promise.all(
          networks.map(id => fetchLiveNetworkStatus(id))
        );
        return res.json({ networks: statuses });
      }

      const status = await fetchLiveNetworkStatus(chainId);
      res.json({ status });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'RPC status error' });
    }
  });

  // Live Aave V3 pool data
  app.get('/api/aave/reserve', async (req, res) => {
    const chainId = req.query.chainId ? Number(req.query.chainId) : 1;
    const assetAddress = (req.query.assetAddress as string) || NETWORKS[chainId]?.usdcAddress || NETWORKS[1].usdcAddress;
    const assetSymbol = (req.query.assetSymbol as string) || 'USDC';

    try {
      const reserveInfo = await fetchAaveReserveData(chainId, assetAddress, assetSymbol);
      res.json({ reserveInfo });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed fetching Aave reserve data' });
    }
  });

  // Universal Liquidity Router Arbitrage Quote
  app.post('/api/arbitrage/quote', async (req, res) => {
    const { chainId, assetSymbol, assetAddress, targetAmount, discountPercent, minProfitMarginPercent } = req.body;

    try {
      const quote = await calculateUniversalArbitrageQuote(
        Number(chainId) || 1,
        assetSymbol || 'USDC',
        assetAddress || NETWORKS[1].usdcAddress,
        Number(targetAmount) || 50000,
        Number(discountPercent) || 15,
        Number(minProfitMarginPercent) || 1.5
      );
      res.json({ quote });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Quote calculation failed' });
    }
  });

  // eth_call EVM Simulation
  app.post('/api/arbitrage/simulate', async (req, res) => {
    const { chainId, visionId, executorAddress, userAddress } = req.body;

    try {
      const simulation = await simulateEthCall(
        Number(chainId) || 1,
        visionId || 'vis_01',
        executorAddress || NETWORKS[1].oskayiExecutor,
        userAddress || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'
      );
      res.json({ simulation });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Simulation failed' });
    }
  });

  // Execute Arbitrage & Disburse
  app.post('/api/arbitrage/execute', async (req, res) => {
    const { visionId, chainId, executorAddress, userAddress } = req.body;

    const vision = db.getVisionById(visionId);
    if (!vision) {
      return res.status(404).json({ error: 'Vision not found' });
    }

    try {
      const selectedChain = Number(chainId) || vision.chainId || 1;
      const quote = await calculateUniversalArbitrageQuote(
        selectedChain,
        vision.assetSymbol,
        vision.assetAddress,
        vision.targetAmount,
        vision.discountPercent,
        vision.minProfitMarginPercent
      );

      if (!quote.isExecutionProfitable) {
        return res.status(400).json({
          error: 'Arbitrage transaction reverted by safety guard: Insufficient profit margin to cover flash loan + funding.',
          quote
        });
      }

      const status = await fetchLiveNetworkStatus(selectedChain);
      const mockTxHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

      // Mark vision as funded in DB
      const updatedVision = db.markVisionFunded(
        visionId,
        mockTxHash,
        status.blockNumber,
        quote.netProfitDisbursedToVisionUsd
      );

      // Record execution
      const record = db.addExecutionRecord({
        visionId,
        txHash: mockTxHash,
        blockNumber: status.blockNumber,
        chainId: selectedChain,
        assetSymbol: vision.assetSymbol,
        flashLoanAmount: quote.borrowAmount,
        flashLoanFee: quote.flashLoanFeeAmount,
        resaleProceeds: quote.estimatedResaleProceeds,
        disbursedProfitToVision: quote.netProfitDisbursedToVisionUsd,
        gasSponsored: vision.gasSponsored,
        gasUsedGwei: status.gasPriceGwei,
        executorAddress: executorAddress || NETWORKS[selectedChain]?.oskayiExecutor || NETWORKS[1].oskayiExecutor,
        dexRouteUsed: 'Uniswap V3 + Curve 3pool Universal Router'
      });

      res.json({
        success: true,
        vision: updatedVision,
        executionRecord: record,
        quote
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Execution failed' });
    }
  });

  // EIP-2771 Relayer Gas Sponsorship
  app.post('/api/relayer/sponsor-tx', async (req, res) => {
    try {
      const result = await processEip2771Sponsorship(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Relay failed' });
    }
  });

  // Get Relayed Transactions History
  app.get('/api/relayer/transactions', (_req, res) => {
    const transactions = db.getRelayedTransactions();
    res.json({ transactions });
  });

  // Get Execution History
  app.get('/api/history/executions', (_req, res) => {
    const executions = db.getExecutionRecords();
    res.json({ executions });
  });

  // Bot Command Endpoint (Telegram/Discord webhook simulator or production webhook)
  app.post('/api/bot/command', async (req, res) => {
    try {
      const { platform = 'telegram', userId = 'bot_user_1', userName = 'crypto_builder', commandText = '/help', chainId = 1 } = req.body;
      const result = await processBotCommand({
        platform,
        userId,
        userName,
        commandText,
        chainId: Number(chainId) || 1
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Bot command execution failed' });
    }
  });

  // Get Bot Activity Logs
  app.get('/api/bot/logs', (_req, res) => {
    const logs = db.getBotLogs();
    res.json({ logs });
  });

  // Serve Vite in dev / Static dist in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Oskayi Instant Capital server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
