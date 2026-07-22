import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Terminal,
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Code2,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  Globe,
  MessageSquare,
  Play,
  Copy,
  Check
} from 'lucide-react';
import { sendBotCommand, getBotLogs, getVisions } from '../services/api';
import { BotLog, Vision } from '../types';

interface BotControlCenterViewProps {
  selectedChainId: number;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  platform: 'telegram' | 'discord';
  text: string;
  logs?: string[];
  timestamp: string;
  status?: 'success' | 'failed' | 'pending';
}

export function BotControlCenterView({ selectedChainId }: BotControlCenterViewProps) {
  const [platform, setPlatform] = useState<'telegram' | 'discord'>('telegram');
  const [userName, setUserName] = useState<string>('crypto_builder');
  const [userId, setUserId] = useState<string>('8492041');
  const [inputCommand, setInputCommand] = useState<string>('/help');
  const [executing, setExecuting] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [activityLogs, setActivityLogs] = useState<BotLog[]>([]);
  const [activeVisions, setActiveVisions] = useState<Vision[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchInitialData = async () => {
    try {
      const logs = await getBotLogs();
      setActivityLogs(logs);
      const visions = await getVisions();
      setActiveVisions(visions);
    } catch (e) {
      console.error('Error fetching bot data:', e);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSendCommand = async (cmdToRun?: string) => {
    const cmd = cmdToRun || inputCommand;
    if (!cmd.trim() || executing) return;

    const userMsgId = `user_${Date.now()}`;
    const botMsgId = `bot_${Date.now()}`;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Append user message to terminal
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      platform,
      text: cmd,
      timestamp: timeStr
    };

    setChatHistory(prev => [...prev, userMsg]);
    if (!cmdToRun) setInputCommand('');
    setExecuting(true);

    try {
      const res = await sendBotCommand({
        platform,
        userId,
        userName,
        commandText: cmd,
        chainId: selectedChainId
      });

      const botMsg: ChatMessage = {
        id: botMsgId,
        sender: 'bot',
        platform,
        text: res.message,
        logs: res.logs,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        status: res.success ? 'success' : 'failed'
      };

      setChatHistory(prev => [...prev, botMsg]);
      // Refresh logs & visions
      await fetchInitialData();
    } catch (err: any) {
      const botMsg: ChatMessage = {
        id: botMsgId,
        sender: 'bot',
        platform,
        text: `⚠️ Execution error: ${err.message || 'Server communication failed'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        status: 'failed'
      };
      setChatHistory(prev => [...prev, botMsg]);
    } finally {
      setExecuting(false);
    }
  };

  const sampleVisionId = activeVisions[0]?.id || 'vis_01';

  const webhookCurlExample = `curl -X POST "${window.location.origin}/api/bot/command" \\
  -H "Content-Type: application/json" \\
  -d '{
    "platform": "${platform}",
    "userId": "${userId}",
    "userName": "${userName}",
    "commandText": "/scan_liquidity ${sampleVisionId}",
    "chainId": ${selectedChainId}
  }'`;

  const copyWebhookCode = () => {
    navigator.clipboard.writeText(webhookCurlExample);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Title & Architecture Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <Bot className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Oskayi DeFi Funding Bot & Interface
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Interactive Telegram & Discord Bot simulator executing EIP-2771 gas-sponsored flash loan arbitrage workflows.
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setPlatform('telegram')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 cursor-pointer transition-colors ${
                platform === 'telegram'
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Telegram Bot</span>
            </button>
            <button
              onClick={() => setPlatform('discord')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 cursor-pointer transition-colors ${
                platform === 'discord'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Discord Bot</span>
            </button>
          </div>
        </div>

        {/* Master Integration Flow Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-850 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">Step 1: Bot Submission</span>
              <Bot className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xs font-bold text-slate-200">/submit_vision</div>
            <p className="text-[11px] text-slate-400 leading-snug">
              User submits project title, funding target, and discount % directly via bot command.
            </p>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-850 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">Step 2: Liquidity Scan</span>
              <Layers className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xs font-bold text-slate-200">/scan_liquidity</div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Bot queries live Aave V3 pools & DEX router depth to compute net arbitrage profit.
            </p>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-850 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">Step 3: Gas Sponsor Relay</span>
              <ShieldCheck className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xs font-bold text-slate-200">/relay_gas</div>
            <p className="text-[11px] text-slate-400 leading-snug">
              EIP-2771 Biconomy / Gelato forwarder signs sponsorship, requiring $0 gas fee from user wallet.
            </p>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-850 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">Step 4: Atomic Execution</span>
              <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400" />
            </div>
            <div className="text-xs font-bold text-slate-200">/execute_arbitrage</div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Borrows loan, resells on DEXs, repays Aave V3, and disburses 100% profit surplus to owner.
            </p>
          </div>
        </div>
      </div>

      {/* Main Terminal & Quick Commands Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Interactive Bot Terminal (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[580px] shadow-2xl">
            {/* Terminal Header */}
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs font-mono font-bold text-slate-300 ml-2 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  Oskayi {platform === 'telegram' ? 'Telegram' : 'Discord'} Gateway Session
                </span>
              </div>

              <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-400">
                <span className="text-emerald-400 font-bold">@oskayi_funding_bot</span>
                <span className="text-slate-600">•</span>
                <span>User: @{userName}</span>
              </div>
            </div>

            {/* Terminal Message Stream */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 font-mono text-xs bg-slate-950/90 selection:bg-emerald-500/30">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <Bot className="w-12 h-12 text-slate-700 animate-bounce" />
                  <div className="text-sm font-bold text-slate-400">Bot Gateway Ready</div>
                  <p className="text-slate-600 text-xs max-w-md">
                    Send a bot command below or click a quick-action shortcut to test live RPC flash loan arbitrage execution.
                  </p>
                </div>
              ) : (
                chatHistory.map((msg) => (
                  <div key={msg.id} className={`space-y-2 ${msg.sender === 'user' ? 'text-cyan-300' : 'text-slate-200'}`}>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-500 border-b border-slate-900 pb-1">
                      {msg.sender === 'user' ? (
                        <span className="text-cyan-400 font-bold">▶ @{userName} ({platform})</span>
                      ) : (
                        <span className="text-emerald-400 font-bold">🤖 @oskayi_funding_bot</span>
                      )}
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    {/* Message Body */}
                    <div className={`p-3 rounded-xl border ${
                      msg.sender === 'user'
                        ? 'bg-cyan-950/30 border-cyan-800/40 text-cyan-200'
                        : msg.status === 'failed'
                        ? 'bg-rose-950/30 border-rose-800/40 text-rose-200'
                        : 'bg-slate-900/90 border-slate-800/80 text-slate-100'
                    }`}>
                      <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed font-sans">{msg.text}</pre>

                      {/* Step-by-Step RPC Logs */}
                      {msg.logs && msg.logs.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-slate-800/80 space-y-1 text-[11px] font-mono text-slate-400">
                          {msg.logs.map((log, idx) => (
                            <div key={idx} className="flex items-start space-x-1.5 text-slate-400">
                              <span className="text-slate-600 text-[10px] select-none">[{idx + 1}]</span>
                              <span>{log}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Command Input Box */}
            <div className="p-3 bg-slate-900 border-t border-slate-800">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendCommand();
                }}
                className="flex items-center space-x-2"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputCommand}
                    onChange={(e) => setInputCommand(e.target.value)}
                    placeholder="Type command e.g. /scan_liquidity vis_01"
                    disabled={executing}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  />
                  {executing && (
                    <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin absolute right-3 top-2.5" />
                  )}
                </div>

                <button
                  type="submit"
                  disabled={executing || !inputCommand.trim()}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Commands & User Switcher */}
        <div className="space-y-6">
          {/* Preset Command Shortcuts */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span>Quick Command Shortcuts</span>
              </h3>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleSendCommand('/help')}
                disabled={executing}
                className="w-full p-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-left transition-colors text-xs font-mono text-slate-300 flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-bold text-emerald-400">/help</div>
                  <div className="text-[10px] text-slate-500">View bot menu & capabilities</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 transition-colors" />
              </button>

              <button
                onClick={() => handleSendCommand(`/submit_vision Quantum Modular DEX | 40000 | 12 | DeFi & AI | 0x71C7656EC7ab88b098defB751B7401B5f6d8976F`)}
                disabled={executing}
                className="w-full p-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-left transition-colors text-xs font-mono text-slate-300 flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-bold text-cyan-400">/submit_vision</div>
                  <div className="text-[10px] text-slate-500">Register new project vision</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 transition-colors" />
              </button>

              <button
                onClick={() => handleSendCommand(`/scan_liquidity ${sampleVisionId}`)}
                disabled={executing}
                className="w-full p-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-left transition-colors text-xs font-mono text-slate-300 flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-bold text-amber-400">/scan_liquidity {sampleVisionId}</div>
                  <div className="text-[10px] text-slate-500">Check DEX liquidity & arbitrage spread</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400 transition-colors" />
              </button>

              <button
                onClick={() => handleSendCommand(`/execute_arbitrage ${sampleVisionId}`)}
                disabled={executing}
                className="w-full p-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-left transition-colors text-xs font-mono text-slate-300 flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-bold text-emerald-400">/execute_arbitrage {sampleVisionId}</div>
                  <div className="text-[10px] text-slate-500">Execute atomic flash loan funding</div>
                </div>
                <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
              </button>

              <button
                onClick={() => handleSendCommand(`/relay_gas ${sampleVisionId}`)}
                disabled={executing}
                className="w-full p-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-left transition-colors text-xs font-mono text-slate-300 flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-bold text-purple-400">/relay_gas {sampleVisionId}</div>
                  <div className="text-[10px] text-slate-500">Verify EIP-2771 Gas Sponsor payload</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-purple-400 transition-colors" />
              </button>

              <button
                onClick={() => handleSendCommand('/status')}
                disabled={executing}
                className="w-full p-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-left transition-colors text-xs font-mono text-slate-300 flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-bold text-blue-400">/status</div>
                  <div className="text-[10px] text-slate-500">Check RPC latency & relayer balances</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 transition-colors" />
              </button>
            </div>
          </div>

          {/* User & Platform Credentials */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
              Bot Gateway Credentials
            </h3>
            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-[10px] text-slate-500 uppercase block mb-1">Bot Username</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase block mb-1">User ID / Chat ID</label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Webhook & Integration API Curl Docs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Code2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Bot Webhook & API Integration Endpoint
            </h3>
          </div>
          <button
            onClick={copyWebhookCode}
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 flex items-center space-x-1.5 cursor-pointer transition-colors"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copiedCode ? 'Copied!' : 'Copy cURL'}</span>
          </button>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto text-emerald-400">
          <pre>{webhookCurlExample}</pre>
        </div>
      </div>

      {/* Live Bot Execution Audit Logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Real-Time Bot Gateway Logs ({activityLogs.length})
            </h3>
          </div>
          <button
            onClick={fetchInitialData}
            className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-500 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Platform</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Command</th>
                <th className="py-3 px-4">Response Output</th>
                <th className="py-3 px-4">Tx Hash / Vision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {activityLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No bot logs recorded yet. Send a command above to populate logs!
                  </td>
                </tr>
              ) : (
                activityLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        log.platform === 'telegram'
                          ? 'bg-sky-950 text-sky-400 border border-sky-800'
                          : 'bg-indigo-950 text-indigo-400 border border-indigo-800'
                      }`}>
                        {log.platform}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-cyan-400">@{log.userName}</td>
                    <td className="py-3 px-4 font-bold text-slate-200">{log.command}</td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-400" title={log.responseMessage}>
                      {log.responseMessage}
                    </td>
                    <td className="py-3 px-4">
                      {log.txHash ? (
                        <span className="text-emerald-400 text-[10px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                          {log.txHash.substring(0, 10)}...
                        </span>
                      ) : log.visionId ? (
                        <span className="text-cyan-400 text-[10px] bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                          {log.visionId}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
