import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  PlusCircle,
  Activity,
  Server,
  CheckCircle2,
  AlertCircle,
  Play,
  Copy,
  Check,
  Terminal,
} from 'lucide-react';
import { useRealtimeStore } from '../../lib/realtimeStore';
import { AUTONOMO_CONTRACT_ADDRESS, AutonomoProject } from '../../lib/data';
import { buildX402HeaderPayload, validateGatewayInput } from '../../lib/math';
import { ZoftReactor3D } from '../circuit/ZoftReactor3D';

export type DashboardTab = 'overview' | 'gateways' | 'activity';

interface DashboardViewProps {
  initialTab?: DashboardTab;
  onInspectProject?: (project: AutonomoProject) => void;
  onTryInPlayground?: (query: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  initialTab = 'overview',
  onInspectProject,
  onTryInPlayground,
}) => {
  const {
    projects,
    callEvents,
    balancesHidden,
    walletConnected,
    walletAddress,
    setBalancesHidden,
    toggleWallet,
    launchApiGateway,
    recordSimulatedCall,
  } = useRealtimeStore();

  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);
  const [activityNetworkFilter, setActivityNetworkFilter] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Gateway Launch Form state
  const [gwName, setGwName] = useState('');
  const [gwSlug, setGwSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [gwUrl, setGwUrl] = useState('https://');
  const [gwMethod, setGwMethod] = useState<'GET' | 'POST'>('GET');
  const [gwPriceUsdg, setGwPriceUsdg] = useState('0.01');
  const [gwPriceAutonomo, setGwPriceAutonomo] = useState('1000');
  const [gwNetwork, setGwNetwork] = useState('Robinhood Chain');
  const [gwPayTo, setGwPayTo] = useState(AUTONOMO_CONTRACT_ADDRESS);
  const [gwDesc, setGwDesc] = useState('');
  const [gwError, setGwError] = useState<string | null>(null);
  const [gwSuccess, setGwSuccess] = useState<string | null>(null);

  const hostedGateways = projects.filter(
    (p) => p.host.includes('autonomo.fun/x/') || p.officialRobinhood
  );

  const filteredEvents = callEvents.filter((evt) =>
    activityNetworkFilter === 'ALL'
      ? true
      : evt.network.toLowerCase().includes(activityNetworkFilter.toLowerCase())
  );

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1600);
  };

  const handleLaunchGateway = (e: React.FormEvent) => {
    e.preventDefault();
    setGwError(null);
    setGwSuccess(null);

    const validation = validateGatewayInput({
      name: gwName,
      slug: gwSlug,
      upstreamUrl: gwUrl,
      priceUsdg: gwPriceUsdg,
      priceAutonomo: gwPriceAutonomo,
      payTo: gwPayTo,
    });

    if (!validation.valid) {
      setGwError(validation.error);
      return;
    }

    const created = launchApiGateway({
      name: gwName.trim(),
      slug: gwSlug.trim(),
      upstreamUrl: gwUrl.trim(),
      method: gwMethod,
      priceUsdg: Number(gwPriceUsdg),
      priceAutonomo: Number(gwPriceAutonomo),
      network: gwNetwork,
      payTo: gwPayTo.trim(),
      description:
        gwDesc.trim() ||
        `Hosted x402 API gateway at autonomo.fun/x/${gwSlug.trim()} settling in USDG and $AUTONOMO.`,
    });

    setGwSuccess(
      `Gateway launched at autonomo.fun/x/${created.slug} and indexed in the catalog.`
    );
    setGwName('');
    setGwSlug('');
    setSlugManuallyEdited(false);
    setGwUrl('https://');
    setGwDesc('');
  };

  return (
    <div className="py-8 space-y-8">
      {/* Top Status & Creator Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#0d0e12] border border-white/10 rounded-2xl p-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#00C805]">
            <span>Autonomo x402 Creator Console</span>
            <span aria-hidden="true">·</span>
            <span>Robinhood Chain &amp; Base</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#f4f4f6]">
            API Launchpad &amp; Gateway Telemetry
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setBalancesHidden(!balancesHidden)}
            className="px-3 py-2 rounded-xl bg-[#12141b] border border-white/10 text-xs font-mono text-[#d4d4d8] hover:text-white inline-flex items-center gap-1.5 cursor-pointer"
          >
            {balancesHidden ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Show Revenue</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Hide Revenue</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={toggleWallet}
            className="px-3.5 py-2 rounded-xl bg-[#161820] border border-white/15 text-xs font-mono text-[#f4f4f6] hover:bg-[#20232b] cursor-pointer"
          >
            {walletConnected ? walletAddress : 'Connect Merchant Wallet'}
          </button>
        </div>
      </div>

      {/* Sub-Tabs Navigation (Pure Autonomo API Launchpad tabs) */}
      <div
        className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-white/10"
        role="tablist"
        aria-label="Dashboard sections"
      >
        {[
          { id: 'overview', label: 'Launch API Gateway', icon: PlusCircle },
          {
            id: 'gateways',
            label: `Hosted Gateways (${hostedGateways.length})`,
            icon: Server,
          },
          { id: 'activity', label: 'Realtime x402 Call Stream', icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id as DashboardTab)}
              className={`px-4 py-2.5 rounded-xl text-xs font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-white text-[#070709] font-semibold'
                  : 'text-[#a1a1aa] hover:text-white hover:bg-[#12141b]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0d0e12] border border-white/10 space-y-1">
          <div className="text-xs text-[#a1a1aa]">
            Gateway Revenue Settled (USDG)
          </div>
          <div className="font-display text-2xl font-bold text-[#00C805] tabular-nums">
            {balancesHidden ? '••••••' : '1,726.30 USDG'}
          </div>
          <div className="text-[11px] font-mono text-[#8b8b97]">
            Robinhood Chain · EIP-3009 Gasless
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0d0e12] border border-white/10 space-y-1">
          <div className="text-xs text-[#a1a1aa]">
            $AUTONOMO Settled via Permit2
          </div>
          <div className="font-display text-2xl font-bold text-[#f4f4f6] tabular-nums">
            {balancesHidden ? '••••••' : '4,820,000'}
          </div>
          <div className="text-[11px] font-mono text-[#8b8b97]">
            1,000 $AUTONOMO / call default
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0d0e12] border border-white/10 space-y-1">
          <div className="text-xs text-[#a1a1aa]">
            Hosted x402 Gateways
          </div>
          <div className="font-display text-2xl font-bold text-[#f4f4f6] tabular-nums">
            {hostedGateways.length} Active
          </div>
          <div className="text-[11px] font-mono text-[#00C805]">
            autonomo.fun/x/*
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0d0e12] border border-white/10 space-y-1">
          <div className="text-xs text-[#a1a1aa]">
            HTTP 200 Settlement Rate
          </div>
          <div className="font-display text-2xl font-bold text-[#f4f4f6] tabular-nums">
            99.8%
          </div>
          <div className="text-[11px] font-mono text-[#8b8b97]">
            Charged only when upstream &lt; 400
          </div>
        </div>
      </div>

      {/* TAB 1: LAUNCH API GATEWAY */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Launch API in Minutes Form */}
          <div className="lg:col-span-7 bg-[#0d0e12] border border-white/10 rounded-2xl p-6 space-y-5">
            <div className="space-y-1">
              <span className="text-xs font-mono text-[#00C805]">
                Hosted x402 Gateway · No Code Required
              </span>
              <h2 className="font-display text-xl font-bold text-[#f4f4f6]">
                Launch your API in minutes
              </h2>
              <p className="text-xs text-[#a1a1aa] leading-relaxed">
                Put any existing HTTPS API behind an Autonomo gateway at{' '}
                <code className="text-[#f4f4f6]">autonomo.fun/x/your-api</code>,
                set a price per call, and AI agents pay you in USDG or
                $AUTONOMO with every request.
              </p>
            </div>

            <form onSubmit={handleLaunchGateway} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="gw-name"
                    className="block text-xs text-[#d4d4d8] mb-1.5"
                  >
                    API Project Name
                  </label>
                  <input
                    id="gw-name"
                    type="text"
                    value={gwName}
                    onChange={(e) => {
                      setGwName(e.target.value);
                      if (!slugManuallyEdited) {
                        setGwSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/^-|-$/g, '')
                        );
                      }
                    }}
                    placeholder="e.g. Solana Whale Radar"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#12141b] border border-white/12 text-sm text-[#f4f4f6] placeholder:text-[#8b8b97] focus:outline-none focus:border-white/40"
                  />
                </div>

                <div>
                  <label
                    htmlFor="gw-slug"
                    className="block text-xs text-[#d4d4d8] mb-1.5"
                  >
                    Gateway Route (/x/your-slug)
                  </label>
                  <input
                    id="gw-slug"
                    type="text"
                    value={gwSlug}
                    onChange={(e) => {
                      setSlugManuallyEdited(true);
                      setGwSlug(e.target.value);
                    }}
                    placeholder="whale-radar"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#12141b] border border-white/12 font-mono text-sm text-[#f4f4f6] placeholder:text-[#8b8b97] focus:outline-none focus:border-white/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-1">
                  <label
                    htmlFor="gw-method"
                    className="block text-xs text-[#d4d4d8] mb-1.5"
                  >
                    Method
                  </label>
                  <select
                    id="gw-method"
                    value={gwMethod}
                    onChange={(e) =>
                      setGwMethod(e.target.value as 'GET' | 'POST')
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-[#12141b] border border-white/12 font-mono text-sm text-[#f4f4f6] focus:outline-none focus:border-white/40"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="gw-url"
                    className="block text-xs text-[#d4d4d8] mb-1.5"
                  >
                    Upstream HTTPS Endpoint URL
                  </label>
                  <input
                    id="gw-url"
                    type="text"
                    value={gwUrl}
                    onChange={(e) => setGwUrl(e.target.value)}
                    placeholder="https://api.example.com/v1/whales"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#12141b] border border-white/12 font-mono text-sm text-[#f4f4f6] placeholder:text-[#8b8b97] focus:outline-none focus:border-white/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="gw-usdg"
                    className="block text-xs text-[#d4d4d8] mb-1.5"
                  >
                    Price per Call (USDG)
                  </label>
                  <input
                    id="gw-usdg"
                    type="text"
                    value={gwPriceUsdg}
                    onChange={(e) => setGwPriceUsdg(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#12141b] border border-white/12 font-mono text-sm text-[#f4f4f6] tabular-nums focus:outline-none focus:border-white/40"
                  />
                </div>

                <div>
                  <label
                    htmlFor="gw-auto"
                    className="block text-xs text-[#d4d4d8] mb-1.5"
                  >
                    Price ($AUTONOMO)
                  </label>
                  <input
                    id="gw-auto"
                    type="text"
                    value={gwPriceAutonomo}
                    onChange={(e) => setGwPriceAutonomo(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#12141b] border border-white/12 font-mono text-sm text-[#f4f4f6] tabular-nums focus:outline-none focus:border-white/40"
                  />
                </div>

                <div>
                  <label
                    htmlFor="gw-net"
                    className="block text-xs text-[#d4d4d8] mb-1.5"
                  >
                    Settlement Chain
                  </label>
                  <select
                    id="gw-net"
                    value={gwNetwork}
                    onChange={(e) => setGwNetwork(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#12141b] border border-white/12 font-mono text-sm text-[#f4f4f6] focus:outline-none focus:border-white/40"
                  >
                    <option value="Robinhood Chain">Robinhood Chain</option>
                    <option value="Base">Base</option>
                    <option value="Solana">Solana</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="gw-payto"
                  className="block text-xs text-[#d4d4d8] mb-1.5"
                >
                  Merchant payTo Wallet Address
                </label>
                <input
                  id="gw-payto"
                  type="text"
                  value={gwPayTo}
                  onChange={(e) => setGwPayTo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#12141b] border border-white/12 font-mono text-xs text-[#f4f4f6] focus:outline-none focus:border-white/40"
                />
              </div>

              <div>
                <label
                  htmlFor="gw-desc"
                  className="block text-xs text-[#d4d4d8] mb-1.5"
                >
                  Agent Discovery Description
                </label>
                <input
                  id="gw-desc"
                  type="text"
                  value={gwDesc}
                  onChange={(e) => setGwDesc(e.target.value)}
                  placeholder="Plain-language summary so AI agents know when to call your endpoint"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#12141b] border border-white/12 text-sm text-[#f4f4f6] placeholder:text-[#8b8b97] focus:outline-none focus:border-white/40"
                />
              </div>

              {gwError && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-[#f87171]/10 border border-[#f87171]/30 text-xs text-[#f87171] flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{gwError}</span>
                </div>
              )}

              {gwSuccess && (
                <div
                  role="status"
                  className="p-3 rounded-xl bg-[#00C805]/15 border border-[#00C805]/40 text-xs text-[#00C805] flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{gwSuccess}</span>
                </div>
              )}

              <div className="pt-1 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-[#8b8b97]">
                  Payment settles only when upstream returns HTTP status &lt; 400.
                </span>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#00C805] text-[#070709] font-semibold text-xs hover:bg-[#10b981] transition-colors cursor-pointer"
                >
                  Create Hosted x402 Gateway
                </button>
              </div>
            </form>
          </div>

          {/* Right: Realtime Call Stream & 3D x402 Gateway Telemetry */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-[#0d0e12] border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-base font-semibold text-[#f4f4f6]">
                    Realtime x402 Call Stream
                  </h3>
                  <p className="text-xs text-[#a1a1aa]">
                    Live agent settlements on Robinhood Chain &amp; Base
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    recordSimulatedCall({
                      endpointPath: '/x/token-price',
                      projectName: 'Token Price',
                      network: 'Robinhood Chain',
                      amountPaid: '1,000',
                      asset: '$AUTONOMO',
                      agentId: `agent-0x${Math.floor(1000 + Math.random() * 9000)}`,
                      httpStatus: 200,
                      latencyMs: 36,
                      mode: 'Simulation',
                    })
                  }
                  className="px-3 py-1.5 rounded-lg bg-[#161820] hover:bg-[#20232b] border border-white/10 text-xs font-mono text-[#00C805] inline-flex items-center gap-1 cursor-pointer"
                >
                  <Play className="w-3 h-3" />
                  <span>Simulate Call</span>
                </button>
              </div>

              <div className="divide-y divide-white/10 max-h-[260px] overflow-y-auto">
                {callEvents.slice(0, 6).map((evt) => (
                  <div
                    key={evt.id}
                    className="py-2.5 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-mono text-[#f4f4f6] font-medium">
                        {evt.endpointPath}{' '}
                        <span className="text-[#8b8b97]">· {evt.agentId}</span>
                      </div>
                      <div className="text-[11px] text-[#8b8b97]">
                        {evt.network} · HTTP {evt.httpStatus} · {evt.latencyMs}ms
                      </div>
                    </div>
                    <div className="text-right font-mono tabular-nums">
                      <div className="text-[#00C805] font-semibold">
                        +{evt.amountPaid} {evt.asset}
                      </div>
                      <div className="text-[11px] text-[#8b8b97]">
                        {evt.timestamp}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0d0e12] border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#f4f4f6]">
                  3D x402 Gateway Telemetry Visualizer
                </span>
                <span className="text-xs font-mono text-[#00C805]">
                  Permit2 &amp; EIP-3009
                </span>
              </div>
              <ZoftReactor3D tier="compact" interactiveControls={true} />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HOSTED GATEWAYS (/x/*) */}
      {activeTab === 'gateways' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-[#f4f4f6]">
                Active Hosted Gateways (autonomo.fun/x/*)
              </h2>
              <p className="text-xs text-[#a1a1aa]">
                Every gateway below responds with HTTP 402 Payment Required when
                called without a PAYMENT-SIGNATURE header.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="px-4 py-2 rounded-xl bg-[#00C805] text-[#070709] text-xs font-semibold hover:bg-[#10b981] cursor-pointer self-start sm:self-auto"
            >
              + New Gateway
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hostedGateways.map((gw) => {
              const ep = gw.endpoints[0];
              const curlCmd = `curl -i https://${gw.host}`;
              const { base64Header } = buildX402HeaderPayload({
                slug: gw.slug,
                priceUsdg: ep?.priceUsdg ?? 0.01,
                priceAutonomo: ep?.priceAutonomo ?? 1000,
                network: 'eip155:4663',
                payTo: gw.payTo || AUTONOMO_CONTRACT_ADDRESS,
                description: gw.description,
              });

              return (
                <div
                  key={gw.id}
                  className="p-5 rounded-2xl bg-[#0d0e12] border border-white/10 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-lg font-semibold text-[#f4f4f6]">
                        {gw.name}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md bg-[#00C805]/15 text-[#00C805] font-mono text-xs">
                        {gw.networks.join(', ')}
                      </span>
                    </div>

                    <div className="text-xs font-mono text-[#a1a1aa]">
                      Route: <span className="text-white">https://{gw.host}</span>
                    </div>

                    <p className="text-xs text-[#a1a1aa] leading-relaxed">
                      {gw.description}
                    </p>

                    <div className="p-3 rounded-xl bg-[#08090c] border border-white/10 font-mono text-[11px] text-[#d4d4d8] space-y-1">
                      <div className="flex items-center justify-between text-[#8b8b97]">
                        <span>{curlCmd}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(gw.id, curlCmd)}
                          className="text-[#00C805] hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === gw.id ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy curl</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="truncate text-[#8b8b97]">
                        PAYMENT-REQUIRED: {base64Header.slice(0, 48)}...
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-[#00C805] tabular-nums">
                      {gw.priceLabel}
                    </span>

                    <div className="flex items-center gap-2">
                      {onInspectProject && (
                        <button
                          type="button"
                          onClick={() => onInspectProject(gw)}
                          className="px-3 py-1.5 rounded-lg bg-[#161820] hover:bg-[#20232b] text-xs font-mono text-[#d4d4d8] cursor-pointer"
                        >
                          Inspect 402
                        </button>
                      )}
                      {onTryInPlayground && (
                        <button
                          type="button"
                          onClick={() =>
                            onTryInPlayground(
                              `Call ${gw.name} (${gw.host}) and summarize its live response.`
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-white text-[#070709] text-xs font-semibold inline-flex items-center gap-1 hover:bg-[#d4d4d8] cursor-pointer"
                        >
                          <Terminal className="w-3 h-3" />
                          <span>Test in Playground</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: REALTIME ACTIVITY */}
      {activeTab === 'activity' && (
        <div className="bg-[#0d0e12] border border-white/10 rounded-2xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h2 className="font-display text-xl font-bold text-[#f4f4f6]">
                Realtime x402 Call &amp; Settlement Log
              </h2>
              <p className="text-xs text-[#a1a1aa]">
                Showing live agent calls and HTTP 402 → 200 settlements across
                indexed gateways.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {['ALL', 'Robinhood Chain', 'Base'].map((net) => (
                <button
                  key={net}
                  type="button"
                  onClick={() => setActivityNetworkFilter(net)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono cursor-pointer ${
                    activityNetworkFilter === net
                      ? 'bg-white text-[#070709] font-semibold'
                      : 'bg-[#12141b] text-[#a1a1aa] hover:text-white'
                  }`}
                >
                  {net}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-white/10">
            {filteredEvents.map((evt) => (
              <div
                key={evt.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="px-2 py-0.5 rounded bg-[#00C805]/15 text-[#00C805] font-semibold">
                      HTTP {evt.httpStatus}
                    </span>
                    <span className="text-[#f4f4f6] font-semibold">
                      {evt.projectName}
                    </span>
                    <span className="text-[#8b8b97]">{evt.endpointPath}</span>
                  </div>
                  <div className="text-[#a1a1aa] font-mono">
                    Agent: {evt.agentId} · Network: {evt.network} · Latency:{' '}
                    {evt.latencyMs}ms
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 font-mono tabular-nums">
                  <span className="text-sm font-semibold text-[#00C805]">
                    +{evt.amountPaid} {evt.asset}
                  </span>
                  <span className="text-[11px] text-[#8b8b97]">
                    {evt.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
