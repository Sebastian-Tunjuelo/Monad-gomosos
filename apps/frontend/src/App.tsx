import { useState, useCallback, useRef } from "react";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useSignTypedData,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { WalletConnect } from "./components/WalletConnect.js";
import { PermissionPreview } from "./components/PermissionPreview.js";
import { Dashboard } from "./components/Dashboard.js";
import { GameBoard } from "./components/GameBoard.js";
import { ActionControls } from "./components/ActionControls.js";
import { ArchitecturePanel } from "./components/ArchitecturePanel.js";
import { StatsBar } from "./components/StatsBar.js";
import { SessionKeyBadge } from "./components/SessionKeyBadge.js";
import { SecurityRejection } from "./components/SecurityRejection.js";
import { AutoPlay } from "./components/AutoPlay.js";
import { SocialFeed } from "./components/SocialFeed.js";
import { LiveExplorer } from "./components/LiveExplorer.js";
import { Leaderboard } from "./components/Leaderboard.js";
import { ThreatModel } from "./components/ThreatModel.js";
import { GasComparison } from "./components/GasComparison.js";
import { CreateKeyPanel } from "./components/CreateKeyPanel.js";
import { KeyImporter } from "./components/KeyImporter.js";
import {
  generateSessionKey,
  signSessionAction,
  RelayerClient,
  getDomain,
} from "@monad-session-arena/sdk";
import {
  keccak256,
  toHex,
  encodeAbiParameters,
  parseAbiParameters,
  parseEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { useNotification } from "./components/Notification.js";
import { APP_CHAIN_ID } from "./lib/chains.js";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

const GAME_TOKEN_ADDRESS = (import.meta.env.VITE_GAME_TOKEN_ADDRESS ||
  ZERO_ADDRESS) as `0x${string}`;
const DEMO_GAME_ADDRESS = (import.meta.env.VITE_DEMO_GAME_ADDRESS ||
  ZERO_ADDRESS) as `0x${string}`;
const DEMO_SOCIAL_ADDRESS = (import.meta.env.VITE_DEMO_SOCIAL_ADDRESS ||
  ZERO_ADDRESS) as `0x${string}`;
const SESSION_MANAGER_ADDRESS = (import.meta.env.VITE_SESSION_MANAGER_ADDRESS ||
  ZERO_ADDRESS) as `0x${string}`;
const EXPLORER_URL = import.meta.env.VITE_EXPLORER_URL || "";

const MAX_TOKEN_SPEND = "50000000000000000000";

const isConfiguredAddress = (address: `0x${string}`) =>
  address !== ZERO_ADDRESS;

const SESSION_MANAGER_REVOKE_ABI = [
  {
    inputs: [{ internalType: "bytes32", name: "sessionId", type: "bytes32" }],
    name: "revokeSession",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const RELAYER_URL = import.meta.env.VITE_RELAYER_URL || "http://localhost:3001";
const relayer = new RelayerClient({ url: RELAYER_URL });

function App() {
  const { address } = useAccount();
  const { addNotification } = useNotification();

  const [playerPos, setPlayerPos] = useState(12);
  const [isApprovingSession, setIsApprovingSession] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [sessionKey, setSessionKey] = useState<any>(null);
  const [sessionId, setSessionId] = useState<`0x${string}` | null>(null);
  const [socialSessionId, setSocialSessionId] = useState<`0x${string}` | null>(null);
  const [generatedKeyStr, setGeneratedKeyStr] = useState<string | null>(null);
  const [sessionMaxTokenSpend, setSessionMaxTokenSpend] = useState<string>(MAX_TOKEN_SPEND);

  // Live metrics for StatsBar
  const [totalActions, setTotalActions] = useState(0);

  // Security rejection overlay
  const [securityError, setSecurityError] = useState<string | null>(null);

  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { signTypedDataAsync } = useSignTypedData();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();

  // ── Monad gas helper ────────────────────────────────────────────────────────
  // On Monad, gas_paid = gas_limit × price (not gas used).
  // For well-known fixed-cost operations we hardcode tight limits.
  // For variable-cost operations we estimate and add only a 10% buffer.
  const isMonadChain = APP_CHAIN_ID === 10143;

  /**
   * Estimate gas for a contract write and return a tight limit (+10% buffer).
   * Falls back to undefined (wallet default) if estimation fails.
   */
  const estimateGas = async (params: {
    address: `0x${string}`;
    abi: readonly unknown[];
    functionName: string;
    args?: readonly unknown[];
    account?: `0x${string}`;
  }): Promise<bigint | undefined> => {
    if (!isMonadChain || !publicClient) return undefined;
    try {
      const estimate = await publicClient.estimateContractGas(params as Parameters<typeof publicClient.estimateContractGas>[0]);
      return estimate + estimate / 10n; // +10% buffer
    } catch {
      return undefined; // fall back to wallet default on estimation failure
    }
  };

  const SESSION_GRANT_TYPES = {
    SessionGrant: [
      { name: "owner", type: "address" },
      { name: "sessionKey", type: "address" },
      { name: "validUntil", type: "uint48" },
      { name: "maxCalls", type: "uint32" },
      { name: "gameContract", type: "address" },
      { name: "allowedActions", type: "uint16" },
      { name: "token", type: "address" },
      { name: "maxTokenSpend", type: "uint256" },
      { name: "salt", type: "bytes32" },
    ],
  } as const;

  const ensureCorrectChain = async () => {
    if (chainId !== APP_CHAIN_ID) {
      await switchChainAsync({ chainId: APP_CHAIN_ID });
    }
  };

  // ─── Create session ───────────────────────────────────────────────────────────
  const handleGenerateSession = async (
    maxCallsParam: number,
    maxTokenSpendParam: string,
    validUntilMinutesParam: number
  ) => {
    if (isApprovingSession) return;
    if (!address) {
      addNotification("error", "Wallet Not Connected", "Connect your wallet first.");
      return;
    }
    if (!isConfiguredAddress(SESSION_MANAGER_ADDRESS) || !isConfiguredAddress(DEMO_GAME_ADDRESS)) {
      addNotification("error", "Contracts Not Configured", "Set VITE_SESSION_MANAGER_ADDRESS and VITE_DEMO_GAME_ADDRESS.");
      return;
    }
    try {
      await ensureCorrectChain();
    } catch (err: any) {
      addNotification("error", "Wrong Network", err?.message || `Switch to chain ${APP_CHAIN_ID}`);
      return;
    }

    setIsApprovingSession(true);
    try {
      const key = generateSessionKey();
      const validUntil = Math.floor(Date.now() / 1000) + (validUntilMinutesParam * 60);
      const maxCalls = maxCallsParam;
      const allowedActions = 30; // POST, LIKE, FOLLOW, REPOST, MOVE, ATTACK, COLLECT, BUY_ITEM etc
      const salt = keccak256(toHex(`${address}:${key.address}:${Date.now()}`));

      const policyGame = {
        owner: address,
        sessionKey: key.address,
        validUntil,
        maxCalls,
        gameContract: DEMO_GAME_ADDRESS,
        allowedActions,
        token: GAME_TOKEN_ADDRESS,
        maxTokenSpend: parseEther(maxTokenSpendParam).toString(),
        salt,
      };

      addNotification("info", "Sign Session Grant", "Sign the EIP-712 session grant in your wallet for Game.");

      const domain = getDomain(APP_CHAIN_ID, SESSION_MANAGER_ADDRESS);
      const ownerSignatureGame = await signTypedDataAsync({
        domain,
        types: SESSION_GRANT_TYPES,
        primaryType: "SessionGrant",
        message: {
          owner: address,
          sessionKey: key.address as `0x${string}`,
          validUntil,
          maxCalls,
          gameContract: DEMO_GAME_ADDRESS,
          allowedActions,
          token: GAME_TOKEN_ADDRESS,
          maxTokenSpend: parseEther(maxTokenSpendParam),
          salt: salt as `0x${string}`,
        },
      });

      addNotification("info", "Registering Session", "Submitting on-chain via relayer...");

      const resultGame = await relayer.createSessionOnChain({ policy: policyGame, ownerSignature: ownerSignatureGame });
      if (!resultGame.success || !resultGame.sessionId) {
        throw new Error(resultGame.error || "Relayer did not return a game sessionId.");
      }

      const newGameSessionId = resultGame.sessionId as `0x${string}`;

      // Register Social Session
      const policySocial = {
        owner: address,
        sessionKey: key.address,
        validUntil,
        maxCalls,
        gameContract: DEMO_SOCIAL_ADDRESS,
        allowedActions,
        token: GAME_TOKEN_ADDRESS,
        maxTokenSpend: parseEther(maxTokenSpendParam).toString(),
        salt,
      };

      addNotification("info", "Sign Social Grant", "Sign the EIP-712 session grant in your wallet for Social.");

      const ownerSignatureSocial = await signTypedDataAsync({
        domain,
        types: SESSION_GRANT_TYPES,
        primaryType: "SessionGrant",
        message: {
          owner: address,
          sessionKey: key.address as `0x${string}`,
          validUntil,
          maxCalls,
          gameContract: DEMO_SOCIAL_ADDRESS,
          allowedActions,
          token: GAME_TOKEN_ADDRESS,
          maxTokenSpend: parseEther(maxTokenSpendParam),
          salt: salt as `0x${string}`,
        },
      });

      const resultSocial = await relayer.createSessionOnChain({ policy: policySocial, ownerSignature: ownerSignatureSocial });
      if (!resultSocial.success || !resultSocial.sessionId) {
        throw new Error(resultSocial.error || "Relayer did not return a social sessionId.");
      }

      const newSocialSessionId = resultSocial.sessionId as `0x${string}`;
      
      // Store in generatedKeyStr
      const exportData = {
        privateKey: key.privateKey,
        sessionId: newGameSessionId,
        socialSessionId: newSocialSessionId,
        maxTokenSpend: parseEther(maxTokenSpendParam).toString()
      };
      setGeneratedKeyStr(btoa(JSON.stringify(exportData)));
      setSessionMaxTokenSpend(parseEther(maxTokenSpendParam).toString());
      
      addNotification(
        "success",
        "Key Generated 🔑",
        "Session is live on-chain. Copy your key to use it!"
      );
    } catch (err: any) {
      addNotification("error", "Session Failed", err?.message || "Session was not activated.");
    } finally {
      setIsApprovingSession(false);
    }
  };

  const handleImportKey = (keyStr: string) => {
    try {
      const data = JSON.parse(atob(keyStr));
      if (!data.privateKey || !data.sessionId) throw new Error("Invalid key format");
      const account = privateKeyToAccount(data.privateKey as `0x${string}`);
      setSessionKey({
        privateKey: data.privateKey,
        account,
        address: account.address
      });
      setSessionId(data.sessionId as `0x${string}`);
      if (data.socialSessionId) setSocialSessionId(data.socialSessionId as `0x${string}`);
      setSessionMaxTokenSpend(data.maxTokenSpend || MAX_TOKEN_SPEND);
      setTotalActions(0);
      addNotification("success", "Key Activated 🎮", "Session credentials loaded successfully.");
    } catch (err: any) {
      addNotification("error", "Import Failed", "The provided key is invalid.");
    }
  };

  // ─── Revoke session ───────────────────────────────────────────────────────────
  const handleRevokeSession = async () => {
    if (!sessionId || !address || !publicClient) return;
    if (!isConfiguredAddress(SESSION_MANAGER_ADDRESS)) {
      addNotification("error", "Not Configured", "No SessionManager address set.");
      return;
    }
    try {
      await ensureCorrectChain();
    } catch (err: any) {
      addNotification("error", "Wrong Network", err?.message);
      return;
    }

    try {
      addNotification("info", "Confirm Revocation", "Sign the on-chain revocation...");
      const hash = await writeContractAsync({
        address: SESSION_MANAGER_ADDRESS,
        abi: SESSION_MANAGER_REVOKE_ABI,
        functionName: "revokeSession",
        args: [sessionId],
        // Monad: revokeSession is ~58k gas. Use tight estimate to avoid overpaying on gas_limit.
        gas: await estimateGas({ address: SESSION_MANAGER_ADDRESS, abi: SESSION_MANAGER_REVOKE_ABI, functionName: "revokeSession", args: [sessionId], account: address }),
      });
      addNotification("info", "Revoking", "Waiting for confirmation...");
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error("Revocation reverted.");

      await relayer.revokeSession(sessionId);
      setSessionKey(null);
      setSessionId(null);
      setSessionMaxTokenSpend(MAX_TOKEN_SPEND);
      addNotification("success", "Session Revoked 🛡", `Confirmed on-chain. Tx: ${hash.slice(0, 10)}…`);
    } catch (err: any) {
      addNotification("error", "Revocation Failed", err?.message || String(err));
    }
  };

  // ─── Execute action ───────────────────────────────────────────────────────────
  const handleAction = async (
    actionId: number,
    params: `0x${string}`,
    onSuccess: () => void,
  ) => {
    if (!sessionKey || !sessionId) {
      addNotification("error", "No Active Session", "Approve a session first.");
      return;
    }
    if (!isConfiguredAddress(SESSION_MANAGER_ADDRESS)) {
      addNotification("error", "Not Configured", "Set VITE_SESSION_MANAGER_ADDRESS.");
      return;
    }

    setIsExecuting(true);
    try {
      const currentNonce = await relayer.getSessionNonce(sessionId);
      const actionPayload = {
        sessionId,
        actionId,
        nonce: currentNonce,
        deadline: Math.floor(Date.now() / 1000) + 3600,
        paramsHash: keccak256(params),
      };

      const domain = getDomain(APP_CHAIN_ID, SESSION_MANAGER_ADDRESS);
      const signature = await signSessionAction(sessionKey.account, domain, actionPayload);

      const result = await relayer.executeAction({ action: actionPayload, params, signature });

      if (result.success) {
        onSuccess();
        setTotalActions((n) => n + 1);
      } else {
        const errMsg = result.error || "Unknown error";
        // Show impressive security rejection overlay for known contract errors
        const isSecurityError = [
          "SessionRevoked", "SessionExpired", "ActionNotAllowed",
          "MaxCallsExceeded", "SpendLimitExceeded", "InvalidNonce", "InvalidSignature",
          "revoked", "expired", "not allowed", "limit exceeded",
        ].some((k) => errMsg.toLowerCase().includes(k.toLowerCase()));

        if (isSecurityError) {
          setSecurityError(errMsg);
        } else if (errMsg.includes("not found on-chain") || errMsg.includes("not registered")) {
          addNotification("error", "Session Not On-Chain", "Click 'Approve Session' to register on-chain.");
        } else {
          addNotification("error", "Execution Failed", errMsg);
        }
      }
    } catch (err: any) {
      addNotification("error", "Execution Error", err?.message || String(err));
    } finally {
      setIsExecuting(false);
    }
  };

  // ─── Game actions ─────────────────────────────────────────────────────────────
  const handleMove = (direction: "up" | "down" | "left" | "right") => {
    let willMove = false;
    if (direction === "up" && playerPos >= 5) willMove = true;
    if (direction === "down" && playerPos < 20) willMove = true;
    if (direction === "left" && playerPos % 5 !== 0) willMove = true;
    if (direction === "right" && playerPos % 5 !== 4) willMove = true;

    if (!willMove) {
      addNotification("error", "Invalid Move", "Cannot move outside the arena.");
      return;
    }
    const params = encodeAbiParameters(parseAbiParameters("uint256"), [1n]);
    handleAction(1, params, () => {
      setPlayerPos((prev) => {
        if (direction === "up" && prev >= 5) return prev - 5;
        if (direction === "down" && prev < 20) return prev + 5;
        if (direction === "left" && prev % 5 !== 0) return prev - 1;
        if (direction === "right" && prev % 5 !== 4) return prev + 1;
        return prev;
      });
    });
  };

  const handleAttack = () => {
    const params = encodeAbiParameters(parseAbiParameters("uint256"), [1n]);
    handleAction(2, params, () => {});
  };

  const handleCollect = () => {
    const params = encodeAbiParameters(parseAbiParameters("uint256"), [1n]);
    handleAction(3, params, () => {});
  };


  // Auto-play fires MOVE actions for the stress test
  const handleAutoAction = async () => {
    const params = encodeAbiParameters(parseAbiParameters("uint256"), [1n]);
    await handleAction(1, params, () => {
      setPlayerPos((prev) => (prev < 24 ? prev + 1 : 0));
    });
  };

  // ─── Tab state ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"game" | "social" | "explorer" | "leaderboard" | "security" | "architecture" | "create_key">("create_key");

  const tabs = [
    { id: "create_key" as const,   label: "🔑 Create Key",  desc: "Generate Key" },
    { id: "game" as const,         label: "🎮 Game",        desc: "Play on-chain" },
    { id: "social" as const,       label: "📢 Social",      desc: "Post on Monad" },
    { id: "explorer" as const,     label: "🔍 Explorer",    desc: "Live events" },
    { id: "leaderboard" as const,  label: "🏆 Leaderboard", desc: "Rankings" },
    { id: "security" as const,     label: "🛡 Security",    desc: "Threat model" },
    { id: "architecture" as const, label: "🏗 Architecture",desc: "How it works" },
  ];

  return (
    <div className="min-h-screen p-6 bg-gray-950 text-white font-sans selection:bg-cyan-500/30">
      {/* Security rejection overlay */}
      <SecurityRejection error={securityError} onDismiss={() => setSecurityError(null)} />

      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
            Monad Session Arena
          </h1>
          <p className="text-gray-600 text-xs mt-0.5 tracking-wider">
            Session Key Infrastructure · Hackathon Demo
          </p>
        </div>
        <div className="flex gap-3 items-center flex-wrap justify-end">
          {sessionKey && (
            <SessionKeyBadge address={sessionKey.address} explorerUrl={EXPLORER_URL || undefined} />
          )}
          <WalletConnect />
        </div>
      </header>

      {/* ── Stats bar ─────────────────────────────────────────────────────────── */}
      <StatsBar actionCount={totalActions} hasActiveSession={!!sessionKey} />

      {/* ── Tab nav ───────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex gap-2 p-1 bg-gray-900/60 border border-white/5 rounded-2xl backdrop-blur-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === tab.id
                  ? "bg-gray-800 text-white shadow-lg border border-white/10"
                  : "text-gray-600 hover:text-gray-400"
              }`}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ───────────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto">

        {/* GAME TAB */}
        {activeTab === "game" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Left: game board */}
            <div className="space-y-6">
              <section>
                <h2 className="text-cyan-500/80 uppercase tracking-[0.2em] text-xs font-bold mb-4 flex items-center gap-3">
                  <span className="w-8 h-[1px] bg-cyan-500/50" />
                  Game Area
                  <span className="w-full h-[1px] bg-gradient-to-r from-cyan-500/50 to-transparent" />
                </h2>
                <div className="flex flex-col items-center">
                  <GameBoard playerPos={playerPos} />
                  <ActionControls
                    onMove={handleMove}
                    onAttack={handleAttack}
                    onCollect={handleCollect}
                    isExecuting={isExecuting}
                  />
                </div>
              </section>
              <AutoPlay
                onAutoAction={handleAutoAction}
                hasSession={!!sessionKey}
                isExecuting={isExecuting}
                burstCount={5}
              />
            </div>

            {/* Right: session panel */}
            <div className="space-y-6">
              <section>
                <h2 className="text-purple-500/80 uppercase tracking-[0.2em] text-xs font-bold mb-4 flex items-center gap-3">
                  <span className="w-full h-[1px] bg-gradient-to-l from-purple-500/50 to-transparent" />
                  Session Status
                  <span className="w-8 h-[1px] bg-purple-500/50" />
                </h2>
                {!sessionKey ? (
                  <KeyImporter
                    onImport={handleImportKey}
                  />
                ) : (
                  <Dashboard
                    relayer={relayer}
                    sessionId={sessionId}
                    maxTokenSpend={sessionMaxTokenSpend}
                    onRevoke={handleRevokeSession}
                  />
                )}
              </section>
            </div>
          </div>
        )}

        {/* CREATE KEY TAB */}
        {activeTab === "create_key" && (
          <div className="max-w-2xl mx-auto">
            <CreateKeyPanel
              onGenerate={handleGenerateSession}
              isApproving={isApprovingSession}
              generatedKeyStr={generatedKeyStr}
            />
          </div>
        )}

        {/* SOCIAL TAB */}
        {activeTab === "social" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Feed */}
            <div className="lg:col-span-2">
              <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl border border-white/5 p-6">
                {!sessionKey ? (
                  <KeyImporter
                    onImport={handleImportKey}
                  />
                ) : (
                  <SocialFeed 
                    relayer={relayer} 
                    sessionKey={sessionKey} 
                    sessionId={socialSessionId || sessionId!} 
                  />
                )}
              </div>
            </div>

            {/* Sidebar: "why this matters" */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-purple-950/40 to-pink-950/40 border border-purple-500/20 rounded-2xl p-5">
                <h3 className="text-sm font-black text-purple-400 mb-3">📢 Same Kit, Different App</h3>
                <p className="text-gray-400 text-xs leading-relaxed mb-4">
                  This social feed runs on the <span className="text-white font-semibold">exact same SessionManager</span> contract as the game.
                  Zero code changes to the core infrastructure.
                </p>
                <div className="space-y-2">
                  {[
                    "Post on-chain — no wallet popup",
                    "Like on-chain — no wallet popup",
                    "Follow on-chain — no wallet popup",
                    "All validated by same EIP-712 logic",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <span className="text-emerald-500 text-[10px] mt-0.5">✓</span>
                      <p className="text-gray-500 text-[11px]">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-900/50 border border-white/5 rounded-2xl p-5">
                <h3 className="text-sm font-black text-cyan-400 mb-3">🔌 DemoSocial.sol</h3>
                <p className="text-gray-500 text-xs leading-relaxed mb-3">
                  A separate contract that implements the <code className="text-cyan-400 bg-black/30 px-1 rounded">IDemoGame</code> interface.
                  The SessionManager calls it — it doesn't care what the app does.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {["POST", "LIKE", "FOLLOW", "REPOST"].map((action, i) => (
                    <div key={action} className="bg-black/30 rounded-lg px-3 py-2 border border-white/5 text-center">
                      <p className="text-[9px] text-gray-600 font-mono">actionId={i + 1}</p>
                      <p className="text-xs font-bold text-white">{action}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-900/50 border border-white/5 rounded-2xl p-5">
                <h3 className="text-sm font-black text-white mb-2">The point</h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Session keys aren't just for games. Any high-frequency dApp on Monad — social, trading, micropayments — can plug into this kit with a single interface.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* LIVE EXPLORER TAB */}
        {activeTab === "explorer" && (
          <div className="space-y-6">
            {/* Intro card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: "🔑",
                  title: "Session Created",
                  desc: "Every new session key authorized on-chain",
                  color: "border-emerald-500/20 bg-emerald-950/10",
                  tc: "text-emerald-400",
                },
                {
                  icon: "⚡",
                  title: "Action Executed",
                  desc: "Every on-chain action relayed without a popup",
                  color: "border-cyan-500/20 bg-cyan-950/10",
                  tc: "text-cyan-400",
                },
                {
                  icon: "🚫",
                  title: "Session Revoked",
                  desc: "Immediate on-chain invalidation, permanent",
                  color: "border-red-500/20 bg-red-950/10",
                  tc: "text-red-400",
                },
              ].map((c) => (
                <div key={c.title} className={`p-4 rounded-2xl border ${c.color} flex gap-3`}>
                  <span className="text-2xl">{c.icon}</span>
                  <div>
                    <p className={`text-xs font-black uppercase tracking-wide ${c.tc}`}>{c.title}</p>
                    <p className="text-gray-600 text-[11px] mt-0.5">{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Live feed */}
            <LiveExplorer />

            {/* Explanation */}
            <div className="bg-gray-900/40 border border-white/5 rounded-2xl p-5">
              <p className="text-gray-500 text-xs leading-relaxed">
                💡 <span className="text-gray-300 font-semibold">Every event above is emitted by the SessionManager contract on Monad.</span>{" "}
                This panel reads directly from on-chain logs — not a database. It updates every 2 seconds.
                During the demo, switch tabs and come back to see new events appear in real time.
              </p>
            </div>
          </div>
        )}

        {/* ARCHITECTURE TAB */}
        {activeTab === "architecture" && (
          <div className="space-y-6">
            <ArchitecturePanel />
            <div className="bg-gradient-to-r from-purple-950/30 via-gray-900/30 to-cyan-950/30 border border-white/5 rounded-2xl p-6">
              <h3 className="text-lg font-black text-white mb-4">🔌 One Kit, Infinite Apps</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { app: "DemoGame", status: "✅ Live", actions: "MOVE · ATTACK · COLLECT · BUY_ITEM", color: "border-cyan-500/30 bg-cyan-950/10", tc: "text-cyan-400" },
                  { app: "DemoSocial", status: "✅ Live", actions: "POST · LIKE · FOLLOW · REPOST", color: "border-purple-500/30 bg-purple-950/10", tc: "text-purple-400" },
                  { app: "Your dApp", status: "🔌 Plug in", actions: "Any actions you define", color: "border-gray-600/30 bg-gray-800/10", tc: "text-gray-400" },
                ].map((item) => (
                  <div key={item.app} className={`p-4 rounded-xl border ${item.color}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className={`text-sm font-black ${item.tc}`}>{item.app}</p>
                      <span className="text-[9px] font-bold text-gray-500">{item.status}</span>
                    </div>
                    <p className="text-gray-600 text-[10px]">{item.actions}</p>
                    <p className="text-gray-700 text-[9px] mt-2 font-mono">implements IDemoGame</p>
                  </div>
                ))}
              </div>
              <p className="text-gray-600 text-[11px] mt-4">
                Any contract implementing <code className="text-cyan-400 bg-black/20 px-1 rounded">IDemoGame.executeAction(address, uint16, bytes)</code> can plug into this kit.
              </p>
            </div>
          </div>
        )}

        {/* LEADERBOARD TAB */}
        {activeTab === "leaderboard" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl border border-white/5 p-6">
                <Leaderboard />
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-yellow-950/30 to-orange-950/30 border border-yellow-500/20 rounded-2xl p-5">
                <h3 className="text-sm font-black text-yellow-400 mb-3">🏆 How scoring works</h3>
                {[
                  { action: "BUY_ITEM", pts: 5, color: "text-pink-400" },
                  { action: "FOLLOW", pts: 4, color: "text-emerald-400" },
                  { action: "POST", pts: 3, color: "text-purple-400" },
                  { action: "ATTACK", pts: 2, color: "text-orange-400" },
                  { action: "COLLECT", pts: 2, color: "text-blue-400" },
                  { action: "MOVE", pts: 1, color: "text-cyan-400" },
                  { action: "LIKE", pts: 1, color: "text-red-400" },
                ].map((r) => (
                  <div key={r.action} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                    <span className={`text-xs font-bold ${r.color}`}>{r.action}</span>
                    <span className="text-gray-400 text-xs font-mono">+{r.pts} pt{r.pts > 1 ? "s" : ""}</span>
                  </div>
                ))}
              </div>
              <div className="bg-gray-900/50 border border-white/5 rounded-2xl p-5">
                <h3 className="text-sm font-black text-white mb-2">Live from the chain</h3>
                <p className="text-gray-500 text-xs leading-relaxed">
                  All stats read directly from <code className="text-cyan-400">DemoGame</code> and <code className="text-purple-400">DemoSocial</code> on-chain. No database. Updates every 5 seconds.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === "security" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl border border-white/5 p-6">
              <ThreatModel sessionId={sessionId} relayer={relayer} hasSession={!!sessionKey} />
            </div>
            <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl border border-white/5 p-6">
              <GasComparison />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
