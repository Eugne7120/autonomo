import React, { useState } from 'react';
import {
  ArrowRight,
  Search,
  Terminal,
  ShieldCheck,
  Cpu,
  Layers,
  ExternalLink,
  Sliders,
} from 'lucide-react';
import { useRealtimeStore } from '../../lib/realtimeStore';
import {
  AutonomoProject,
  NETWORK_COUNTS,
  USE_CASE_PRESETS,
} from '../../lib/data';
import { calculateJoinSplit } from '../../lib/math';
import { ZoftReactor3D } from '../circuit/ZoftReactor3D';
import { IsometricBrickStrip } from '../circuit/IsometricBrickStrip';

export type AppRoute =
  | 'home'
  | 'projects'
  | 'playground'
  | 'dashboard'
  | 'lab'
  | 'docs';

interface HomeViewProps {
  onNavigate: (
    route: AppRoute,
    params?: { category?: string; network?: string; query?: string; playgroundQuery?: string }
  ) => void;
  onInspectProject: (project: AutonomoProject) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onInspectProject,
}) => {
  const { projects, circuitConfig, updateCircuitConfig, applyPreset } =
    useRealtimeStore();
  const [searchInput, setSearchInput] = useState('');

  const topServices = projects
    .filter((p) => p.category === 'service')
    .sort((a, b) => b.calls30d - a.calls30d)
    .slice(0, 10);

  const facilitators = projects.filter((p) => p.category === 'facilitator');
  const sdks = projects.filter((p) => p.category === 'sdk');

  const splitResult = calculateJoinSplit(
    circuitConfig.amountInput,
    circuitConfig.withdrawalSplitPercent
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('projects', { query: searchInput });
  };

  return (
    <div className="space-y-20 pb-20">
      {/* 1. HERO SECTION (Bounded 2-Column Split: Copy 56% / 3D Reactor 44%) */}
      <section className="pt-8 sm:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {/* Left Column: Value Proposition, Search & Actions */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <p className="text-xs font-mono tracking-wider text-[#00C805]">
                The agentic x402 launchpad for APIs · Robinhood Chain &amp; Base
              </p>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-[54px] font-bold tracking-tight text-[#f4f4f6] leading-[1.08]">
                Launch your API.{' '}
                <span className="text-[#00C805]">Let agents pay.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#d4d4d8] max-w-[62ch] leading-relaxed">
                Put an x402 price on any endpoint and AI agents can discover it
                and pay per call in{' '}
                <span className="text-white font-medium">USDG</span> or{' '}
                <span className="text-white font-medium">$AUTONOMO</span> on
                Robinhood Chain, with no keys, accounts or invoices. 3.7K
                projects and 107.7K paid endpoints have already launched.
              </p>
            </div>

            {/* Primary & Secondary CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="px-5 py-3 rounded-xl bg-[#00C805] text-[#070709] font-semibold text-sm hover:bg-[#10b981] transition-colors inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <span>Launch your API</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('playground')}
                className="px-5 py-3 rounded-xl bg-[#12141b] text-[#f4f4f6] border border-white/15 font-medium text-sm hover:bg-[#20232b] transition-colors whitespace-nowrap cursor-pointer"
              >
                Try Agent Playground
              </button>

              <button
                type="button"
                onClick={() => onNavigate('docs')}
                className="px-4 py-3 rounded-xl text-[#a1a1aa] hover:text-white text-sm font-medium transition-colors whitespace-nowrap cursor-pointer"
              >
                Connect your agent →
              </button>
            </div>

            {/* Live Catalog Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center gap-2 max-w-xl pt-1"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#8b8b97] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search for weather, token risk, Solana data, facilitators..."
                  aria-label="Search projects"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0d0e12] border border-white/12 text-sm text-[#f4f4f6] placeholder:text-[#8b8b97] focus:outline-none focus:border-white/40 transition-colors"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-3 rounded-xl bg-white text-[#070709] font-semibold text-sm hover:bg-[#d4d4d8] transition-colors whitespace-nowrap cursor-pointer"
              >
                Search
              </button>
            </form>
          </div>

          {/* Right Column: Compact 3D x402 Gateway & Settlement Engine */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-[#0d0e12] border border-white/10 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold text-[#f4f4f6]">
                  3D x402 Gateway &amp; Settlement Engine
                </h2>
                <p className="text-xs text-[#a1a1aa]">
                  Interactive $AUTONOMO (Permit2) &amp; USDG (EIP-3009) visualizer
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('playground')}
                className="text-xs font-mono text-[#00C805] hover:underline whitespace-nowrap cursor-pointer"
              >
                Playground →
              </button>
            </div>

            <ZoftReactor3D tier="hero" interactiveControls={true} />

            <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-white/10 text-xs">
              <div>
                <div className="text-[#8b8b97]">Daily Gateway Volume</div>
                <div className="font-mono font-semibold text-[#f4f4f6] tabular-nums mt-0.5">
                  {splitResult.totalFormatted} USDG
                </div>
              </div>
              <div>
                <div className="text-[#8b8b97]">
                  $AUTONOMO ({circuitConfig.withdrawalSplitPercent}%)
                </div>
                <div className="font-mono font-semibold text-[#00C805] tabular-nums mt-0.5">
                  {splitResult.intentFormatted} USDG eq.
                </div>
              </div>
              <div>
                <div className="text-[#8b8b97]">
                  USDG ({100 - circuitConfig.withdrawalSplitPercent}%)
                </div>
                <div className="font-mono font-semibold text-[#d4d4d8] tabular-nums mt-0.5">
                  {splitResult.changeFormatted} USDG
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Metric Strip Below Hero Split */}
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div>
            <dt className="text-xs text-[#a1a1aa]">Projects Indexed</dt>
            <dd className="font-display text-2xl sm:text-3xl font-bold text-[#f4f4f6] tabular-nums mt-1">
              3.7K
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#a1a1aa]">Paid Endpoints</dt>
            <dd className="font-display text-2xl sm:text-3xl font-bold text-[#f4f4f6] tabular-nums mt-1">
              107.7K
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#a1a1aa]">Paid Calls (Last 30d)</dt>
            <dd className="font-display text-2xl sm:text-3xl font-bold text-[#00C805] tabular-nums mt-1">
              894.4K
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#a1a1aa]">Primary Settlement</dt>
            <dd className="font-mono text-sm sm:text-base font-semibold text-[#f4f4f6] mt-2">
              Robinhood Chain · Base · Solana
            </dd>
          </div>
        </dl>
      </section>

      {/* 2. HOW A LAUNCH WORKS (01, 02, 03) */}
      <section aria-labelledby="how-launch-heading" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2
              id="how-launch-heading"
              className="font-display text-2xl sm:text-3xl font-bold text-[#f4f4f6]"
            >
              How a launch works
            </h2>
            <p className="text-sm text-[#a1a1aa] mt-1">
              Turn any HTTP route into a machine-payable endpoint in three steps.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('docs')}
            className="text-xs font-mono text-[#00C805] hover:underline self-start sm:self-auto cursor-pointer"
          >
            Read full x402 specification →
          </button>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <li className="p-6 rounded-2xl bg-[#0d0e12] border border-white/10 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-[#00C805]">
                  01. Price your endpoint
                </span>
                <Terminal className="w-4 h-4 text-[#8b8b97]" />
              </div>
              <h3 className="font-display text-lg font-semibold text-[#f4f4f6]">
                Return HTTP 402 Payment Required
              </h3>
              <p className="text-sm text-[#a1a1aa] leading-relaxed">
                Add x402 middleware from an SDK or use the no-code hosted
                gateway at <code className="text-[#d4d4d8]">autonomo.fun/x/your-api</code>.
                Unpaid requests receive a 402 header with your price, network
                and <code className="text-[#d4d4d8]">payTo</code> wallet.
              </p>
            </div>
            <div className="pt-3 border-t border-white/10 text-xs font-mono text-[#8b8b97]">
              Scheme: EIP-3009 (USDG) · Permit2 ($AUTONOMO)
            </div>
          </li>

          <li className="p-6 rounded-2xl bg-[#0d0e12] border border-white/10 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-[#00C805]">
                  02. Launch it
                </span>
                <Layers className="w-4 h-4 text-[#8b8b97]" />
              </div>
              <h3 className="font-display text-lg font-semibold text-[#f4f4f6]">
                Index in the Bazaar Discovery Catalog
              </h3>
              <p className="text-sm text-[#a1a1aa] leading-relaxed">
                Register with a Bazaar-enabled facilitator (Coinbase CDP, PayAI,
                or Autonomo Robinhood Facilitator) to appear automatically, or
                launch directly from your dashboard.
              </p>
            </div>
            <div className="pt-3 border-t border-white/10 text-xs font-mono text-[#8b8b97]">
              Discovery: Open JSON API · Zero API Keys
            </div>
          </li>

          <li className="p-6 rounded-2xl bg-[#0d0e12] border border-white/10 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-[#00C805]">
                  03. Agents pay per call
                </span>
                <ShieldCheck className="w-4 h-4 text-[#8b8b97]" />
              </div>
              <h3 className="font-display text-lg font-semibold text-[#f4f4f6]">
                Instant On-Chain Settlement in Seconds
              </h3>
              <p className="text-sm text-[#a1a1aa] leading-relaxed">
                Agents find your endpoint through the Autonomo API, sign a
                stablecoin or $AUTONOMO authorization and retry. Settlement
                lands directly in your wallet with zero custody.
              </p>
            </div>
            <div className="pt-3 border-t border-white/10 text-xs font-mono text-[#8b8b97]">
              Settlement: Robinhood Chain · Base · Solana
            </div>
          </li>
        </ol>
      </section>

      {/* 3. BROWSE BY CATEGORY */}
      <section aria-labelledby="browse-category-heading" className="space-y-5">
        <h2
          id="browse-category-heading"
          className="font-display text-2xl sm:text-3xl font-bold text-[#f4f4f6]"
        >
          Browse by category
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              cat: 'service',
              title: 'Paid services',
              count: '3,711',
              desc: 'APIs and content you pay for per request',
            },
            {
              cat: 'facilitator',
              title: 'Facilitators',
              count: '16',
              desc: 'Verify and settle payments on-chain',
            },
            {
              cat: 'sdk',
              title: 'SDKs',
              count: '4',
              desc: 'Libraries for adding x402 to clients and servers',
            },
            {
              cat: 'extension',
              title: 'Extensions',
              count: '6',
              desc: 'Identity, receipts, refunds and more',
            },
            {
              cat: 'explorer',
              title: 'Explorers & directories',
              count: '5',
              desc: 'Track activity and find services',
            },
          ].map((item) => (
            <button
              key={item.cat}
              type="button"
              onClick={() => onNavigate('projects', { category: item.cat })}
              className="text-left p-5 rounded-2xl bg-[#0d0e12] border border-white/10 hover:border-white/30 hover:bg-[#12141b] transition-all flex flex-col justify-between gap-4 cursor-pointer"
            >
              <div className="flex items-baseline justify-between gap-2 w-full">
                <span className="font-display font-semibold text-base text-[#f4f4f6]">
                  {item.title}
                </span>
                <span className="font-mono text-sm text-[#00C805] tabular-nums">
                  {item.count}
                </span>
              </div>
              <p className="text-xs text-[#a1a1aa] leading-relaxed">
                {item.desc}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* 4. MOST USED SERVICES THIS MONTH */}
      <section aria-labelledby="most-used-heading" className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2
              id="most-used-heading"
              className="font-display text-2xl sm:text-3xl font-bold text-[#f4f4f6]"
            >
              Most used services this month
            </h2>
            <p className="text-sm text-[#a1a1aa] mt-0.5">
              Click any service to inspect its HTTP 402 header payload or test in
              the Agent Playground.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('projects', { category: 'service' })}
            className="text-sm font-medium text-[#00C805] hover:underline whitespace-nowrap cursor-pointer"
          >
            View all →
          </button>
        </div>

        <div className="rounded-2xl bg-[#0d0e12] border border-white/10 divide-y divide-white/10">
          {topServices.map((proj) => (
            <div
              key={proj.id}
              onClick={() => onInspectProject(proj)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onInspectProject(proj);
                }
              }}
              className="p-4 sm:p-5 hover:bg-[#12141b] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
            >
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#a1a1aa]">
                  <span className="font-display text-base font-semibold text-[#f4f4f6]">
                    {proj.name}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#00C805] font-mono">
                    {proj.networks.join(', ')}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-[#8b8b97]">{proj.host}</span>
                </div>
                <p className="text-sm text-[#a1a1aa] line-clamp-2 leading-relaxed">
                  {proj.description}
                </p>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
                <div className="text-left md:text-right">
                  <div className="font-mono text-sm font-semibold text-[#f4f4f6] tabular-nums">
                    {proj.priceLabel}
                  </div>
                  <div className="text-xs text-[#8b8b97] font-mono tabular-nums">
                    {proj.endpointsCount.toLocaleString('en-US')}{' '}
                    {proj.endpointsCount === 1 ? 'endpoint' : 'endpoints'}
                  </div>
                </div>

                <div className="text-right min-w-[92px]">
                  <div className="font-mono text-sm font-semibold text-[#00C805] tabular-nums">
                    {(proj.calls30d / 1000).toFixed(1)}K
                  </div>
                  <div className="text-xs text-[#8b8b97]">calls / 30d</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. INTERACTIVE x402 API REVENUE & SETTLEMENT SIMULATOR */}
      <section
        aria-labelledby="explorer-heading"
        className="p-6 sm:p-8 rounded-2xl bg-[#0d0e12] border border-white/10 space-y-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="text-xs font-mono text-[#00C805]">
              Interactive 3D Gateway Simulator · Robinhood Chain
            </p>
            <h2
              id="explorer-heading"
              className="font-display text-2xl sm:text-3xl font-bold text-[#f4f4f6] mt-1"
            >
              Simulate API Call Volume &amp; x402 Settlement Mix
            </h2>
            <p className="text-sm text-[#a1a1aa] mt-1 max-w-2xl">
              Estimate your API revenue across $AUTONOMO (Permit2) and USDG
              (EIP-3009) as autonomous agents call your hosted gateway.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'payroll', label: 'AI & LLM API (65%)' },
              { id: 'treasury', label: 'DeFi Feed (80%)' },
              { id: 'b2b', label: 'Data Oracle (75%)' },
              { id: 'portfolio', label: 'RPC Node (50%)' },
            ].map((preset, idx) => {
              const pcts = [65, 80, 75, 50];
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    circuitConfig.withdrawalSplitPercent === pcts[idx]
                      ? 'bg-white text-[#070709] font-semibold'
                      : 'bg-[#161820] text-[#d4d4d8] hover:bg-[#20232b]'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Interactive Controls & Isometric Brick Strip */}
          <div className="lg:col-span-7 space-y-6">
            <IsometricBrickStrip
              valuePercent={circuitConfig.withdrawalSplitPercent}
              onChangePercent={(val) =>
                updateCircuitConfig({ withdrawalSplitPercent: val })
              }
              label="$AUTONOMO (Permit2) vs USDG (EIP-3009) Settlement Share"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="explorer-amount"
                  className="block text-xs text-[#a1a1aa] mb-1.5"
                >
                  Projected Monthly Revenue (USDG eq.)
                </label>
                <input
                  id="explorer-amount"
                  type="text"
                  value={circuitConfig.amountInput}
                  onChange={(e) =>
                    updateCircuitConfig({ amountInput: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#12141b] border border-white/12 font-mono text-sm text-[#f4f4f6] tabular-nums focus:outline-none focus:border-white/40"
                />
              </div>

              <div>
                <label
                  htmlFor="explorer-notes"
                  className="block text-xs text-[#a1a1aa] mb-1.5"
                >
                  Active Hosted Routes (/x/*)
                </label>
                <select
                  id="explorer-notes"
                  value={circuitConfig.selectedNoteIds.length}
                  onChange={(e) => {
                    const count = Number(e.target.value);
                    const ids = ['note-01', 'note-02', 'note-03', 'note-04'].slice(
                      0,
                      count
                    );
                    updateCircuitConfig({ selectedNoteIds: ids });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#12141b] border border-white/12 font-mono text-sm text-[#f4f4f6] focus:outline-none focus:border-white/40"
                >
                  <option value={1}>1 Endpoint (/x/token-price)</option>
                  <option value={2}>2 Endpoints (Price + Risk)</option>
                  <option value={3}>3 Endpoints (Full Suite)</option>
                  <option value={4}>4+ Endpoints (Multi-Route)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="explorer-compose"
                  className="block text-xs text-[#a1a1aa] mb-1.5"
                >
                  Primary Facilitator
                </label>
                <select
                  id="explorer-compose"
                  value={circuitConfig.selectedComposeRoute}
                  onChange={(e) =>
                    updateCircuitConfig({
                      selectedComposeRoute: e.target
                        .value as typeof circuitConfig.selectedComposeRoute,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#12141b] border border-white/12 font-mono text-sm text-[#f4f4f6] focus:outline-none focus:border-white/40"
                >
                  <option value="direct">Autonomo Robinhood Facilitator</option>
                  <option value="aave-v3">Coinbase CDP Facilitator</option>
                  <option value="uniswap-v4">PayAI Multi-Chain Facilitator</option>
                  <option value="pendle-pt">Dexter Facilitator</option>
                </select>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#12141b] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 text-xs">
                <div className="text-[#a1a1aa]">
                  Projected On-Chain Settlement Breakdown
                </div>
                <div className="font-mono text-sm text-[#f4f4f6] tabular-nums">
                  {splitResult.totalFormatted} USDG ={' '}
                  <span className="text-[#00C805] font-semibold">
                    {splitResult.intentFormatted} in $AUTONOMO
                  </span>{' '}
                  + {splitResult.changeFormatted} in USDG
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="px-4 py-2.5 rounded-xl bg-white text-[#070709] font-semibold text-xs hover:bg-[#d4d4d8] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Launch Your API Gateway</span>
              </button>
            </div>
          </div>

          {/* Right: Synchronized Compact 3D Engine */}
          <div className="lg:col-span-5">
            <ZoftReactor3D tier="compact" interactiveControls={true} />
          </div>
        </div>
      </section>

      {/* 6. FACILITATORS, SDKS & NETWORKS */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Facilitators Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-[#f4f4f6]">
              Facilitators
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('projects', { category: 'facilitator' })}
              className="text-xs font-mono text-[#00C805] hover:underline cursor-pointer"
            >
              View all 16 →
            </button>
          </div>

          <div className="rounded-2xl bg-[#0d0e12] border border-white/10 divide-y divide-white/10">
            {facilitators.map((fac) => (
              <div
                key={fac.id}
                onClick={() => onInspectProject(fac)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onInspectProject(fac);
                  }
                }}
                className="p-4 hover:bg-[#12141b] transition-colors cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-[#a1a1aa]">
                    <span className="font-display font-semibold text-sm text-[#f4f4f6]">
                      {fac.name}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#00C805] font-mono">
                      {fac.networks.join(', ')}
                    </span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[#8b8b97]" />
                </div>
                <p className="text-xs text-[#a1a1aa] leading-relaxed">
                  {fac.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* SDKs & Networks Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold text-[#f4f4f6]">
                SDKs
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('projects', { category: 'sdk' })}
                className="text-xs font-mono text-[#00C805] hover:underline cursor-pointer"
              >
                View all →
              </button>
            </div>

            <div className="rounded-2xl bg-[#0d0e12] border border-white/10 divide-y divide-white/10">
              {sdks.map((sdk) => (
                <div
                  key={sdk.id}
                  onClick={() => onInspectProject(sdk)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onInspectProject(sdk);
                    }
                  }}
                  className="p-4 hover:bg-[#12141b] transition-colors cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display font-semibold text-sm text-[#f4f4f6]">
                      {sdk.name}
                    </span>
                    <span className="font-mono text-xs text-[#8b8b97]">
                      {sdk.priceLabel}
                    </span>
                  </div>
                  <p className="text-xs text-[#a1a1aa] leading-relaxed">
                    {sdk.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Networks Directory */}
          <div className="p-5 rounded-2xl bg-[#0d0e12] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-[#f4f4f6]">
                Supported Networks
              </h3>
              <Cpu className="w-4 h-4 text-[#00C805]" />
            </div>
            <div className="flex flex-wrap gap-2">
              {NETWORK_COUNTS.map((net) => (
                <button
                  key={net.slug}
                  type="button"
                  onClick={() => onNavigate('projects', { network: net.slug })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                    net.highlight
                      ? 'bg-[#00C805]/15 text-[#00C805] border border-[#00C805]/30 hover:bg-[#00C805]/25'
                      : 'bg-[#12141b] text-[#d4d4d8] border border-white/10 hover:border-white/30'
                  }`}
                >
                  {net.name} · {net.count}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
