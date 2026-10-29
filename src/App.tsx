/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Copy,
  Check,
  X,
  Terminal,
  Compass,
  Play,
  LayoutDashboard,
  BookOpen,
  Home,
} from 'lucide-react';
import { RealtimeStoreProvider } from './lib/realtimeStore';
import {
  AUTONOMO_CONTRACT_ADDRESS,
  AutonomoProject,
} from './lib/data';
import { buildX402HeaderPayload } from './lib/math';
import { HomeView, AppRoute } from './components/views/HomeView';
import { ExploreProjectsView } from './components/views/ExploreProjectsView';
import { PlaygroundView } from './components/views/PlaygroundView';
import { DashboardView, DashboardTab } from './components/views/DashboardView';
import { DocsView } from './components/views/DocsView';

function AutonomoShell() {
  const [route, setRoute] = useState<AppRoute>('home');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterNetwork, setFilterNetwork] = useState<string>('any');
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [playgroundPrompt, setPlaygroundPrompt] = useState<string>('');
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>('overview');
  const [inspectedProject, setInspectedProject] =
    useState<AutonomoProject | null>(null);
  const [copiedCa, setCopiedCa] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const handleNavigate = (
    targetRoute: AppRoute,
    params?: {
      category?: string;
      network?: string;
      query?: string;
      playgroundQuery?: string;
    }
  ) => {
    if (params?.category !== undefined) setFilterCategory(params.category);
    else if (targetRoute === 'projects') setFilterCategory('all');

    if (params?.network !== undefined) setFilterNetwork(params.network);
    else if (targetRoute === 'projects') setFilterNetwork('any');

    if (params?.query !== undefined) setFilterQuery(params.query);
    else if (targetRoute === 'projects') setFilterQuery('');

    if (params?.playgroundQuery !== undefined) {
      setPlaygroundPrompt(params.playgroundQuery);
    }

    setRoute(targetRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyContract = () => {
    navigator.clipboard?.writeText(AUTONOMO_CONTRACT_ADDRESS);
    setCopiedCa(true);
    setTimeout(() => setCopiedCa(false), 1800);
  };

  const renderInspectorModal = () => {
    if (!inspectedProject) return null;
    const ep = inspectedProject.endpoints[0];
    const { json, base64Header } = buildX402HeaderPayload({
      slug: inspectedProject.slug,
      priceUsdg: ep?.priceUsdg ?? (inspectedProject.minPriceUsd || 0.01),
      priceAutonomo: ep?.priceAutonomo ?? 1000,
      network: inspectedProject.networks[0] || 'eip155:4663',
      payTo: inspectedProject.payTo || AUTONOMO_CONTRACT_ADDRESS,
      description: inspectedProject.description,
    });

    const curlCmd = `curl -i https://${inspectedProject.host}${
      ep?.path && !inspectedProject.host.includes('/x/') ? ep.path : ''
    }`;

    return (
      <div
        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inspector-modal-title"
      >
        <div className="w-full max-w-2xl rounded-2xl bg-[#0d0e12] border border-white/15 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
            <div className="space-y-1">
              <div className="text-xs font-mono text-[#00C805]">
                HTTP 402 Resource Inspector · {inspectedProject.category.toUpperCase()}
              </div>
              <h2
                id="inspector-modal-title"
                className="font-display text-2xl font-bold text-[#f4f4f6]"
              >
                {inspectedProject.name}
              </h2>
              <div className="text-xs font-mono text-[#8b8b97]">
                {inspectedProject.host} · {inspectedProject.networks.join(', ')}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setInspectedProject(null)}
              aria-label="Close resource inspector"
              className="p-2 rounded-lg bg-[#161820] text-[#a1a1aa] hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-[#d4d4d8] leading-relaxed">
            {inspectedProject.description}
          </p>

          {/* curl -i preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-[#a1a1aa]">
              <span>1. Probe HTTP 402 Handshake</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(curlCmd);
                  setCopiedCurl(true);
                  setTimeout(() => setCopiedCurl(false), 1600);
                }}
                className="text-[#00C805] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                {copiedCurl ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy curl</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3.5 rounded-xl bg-[#08090c] border border-white/10 text-xs font-mono text-[#f4f4f6] overflow-x-auto">
              {`${curlCmd}\n# HTTP/1.1 402 Payment Required\n# PAYMENT-REQUIRED: ${base64Header.slice(0, 56)}...`}
            </pre>
          </div>

          {/* Decoded PAYMENT-REQUIRED JSON */}
          <div className="space-y-2">
            <div className="text-xs font-mono text-[#a1a1aa]">
              2. Decoded PAYMENT-REQUIRED Header Payload
            </div>
            <pre className="p-3.5 rounded-xl bg-[#08090c] border border-white/10 text-xs font-mono text-[#d4d4d8] overflow-x-auto max-h-48">
              {JSON.stringify(json, null, 2)}
            </pre>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
            <div className="text-xs font-mono text-[#8b8b97] tabular-nums">
              Price: {inspectedProject.priceLabel} ·{' '}
              {(inspectedProject.calls30d / 1000).toFixed(1)}K calls / 30d
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setInspectedProject(null)}
                className="px-4 py-2 rounded-xl bg-[#161820] text-xs text-[#d4d4d8] cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetName = inspectedProject.name;
                  setInspectedProject(null);
                  handleNavigate('playground', {
                    playgroundQuery: `Call ${targetName} and summarize its live response.`,
                  });
                }}
                className="px-4 py-2 rounded-xl bg-[#00C805] text-[#070709] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#10b981] cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Test in Agent Playground</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070709] text-[#f4f4f6]">
      {/* Official $AUTONOMO Contract Address Top Strip */}
      <div className="bg-[#0d0e12] border-b border-white/10 px-4 py-1.5 text-xs font-mono flex items-center justify-center gap-2.5">
        <span className="font-semibold text-[#00C805]">$AUTONOMO</span>
        <span className="text-[#8b8b97]">CA</span>
        <span className="text-[#d4d4d8] truncate max-w-[190px] sm:max-w-none">
          {AUTONOMO_CONTRACT_ADDRESS}
        </span>
        <button
          type="button"
          onClick={handleCopyContract}
          aria-label="Copy $AUTONOMO contract address"
          className="px-2 py-0.5 rounded bg-[#161820] hover:bg-[#20232b] border border-white/15 text-[11px] text-[#f4f4f6] inline-flex items-center gap-1 transition-colors cursor-pointer shrink-0"
        >
          {copiedCa ? (
            <>
              <Check className="w-3 h-3 text-[#00C805]" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Global Header (Strict 3-Zone Top Bar matching autonomo.fun) */}
      <header className="sticky top-0 z-30 bg-[#070709]/95 border-b border-white/10">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single Text Wordmark */}
          <button
            type="button"
            onClick={() => handleNavigate('home')}
            className="font-display text-lg font-bold tracking-tight text-[#f4f4f6] hover:text-[#00C805] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            AUTONOMO
          </button>

          {/* Zone 2: Concise Single-Line Navigation Links */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-[#a1a1aa]"
          >
            {(
              [
                { id: 'projects', label: 'Explore APIs' },
                { id: 'playground', label: 'Playground' },
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'docs', label: 'Docs' },
              ] as const
            ).map((navItem) => (
              <button
                key={navItem.id}
                type="button"
                onClick={() => handleNavigate(navItem.id)}
                className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
                  route === navItem.id
                    ? 'text-white border-b-2 border-[#00C805]'
                    : ''
                }`}
              >
                {navItem.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => {
                setDashboardTab('overview');
                handleNavigate('dashboard');
              }}
              className="px-4 py-2 rounded-xl bg-[#00C805] text-[#070709] text-xs font-semibold hover:bg-[#10b981] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Launch your API
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-8 pb-20 md:pb-12">
        {route === 'home' && (
          <HomeView
            onNavigate={handleNavigate}
            onInspectProject={(proj) => setInspectedProject(proj)}
          />
        )}

        {route === 'projects' && (
          <ExploreProjectsView
            initialCategory={filterCategory}
            initialNetwork={filterNetwork}
            initialQuery={filterQuery}
            onInspectProject={(proj) => setInspectedProject(proj)}
            onTryInPlayground={(q) =>
              handleNavigate('playground', { playgroundQuery: q })
            }
          />
        )}

        {route === 'playground' && (
          <PlaygroundView
            initialQuery={playgroundPrompt}
            onNavigateDashboard={() => {
              setDashboardTab('overview');
              handleNavigate('dashboard');
            }}
            onInspectProject={(proj) => setInspectedProject(proj)}
          />
        )}

        {route === 'dashboard' && (
          <DashboardView
            initialTab={dashboardTab}
            onInspectProject={(proj) => setInspectedProject(proj)}
            onTryInPlayground={(q) =>
              handleNavigate('playground', { playgroundQuery: q })
            }
          />
        )}

        {route === 'docs' && (
          <DocsView
            onNavigateDashboard={() => {
              setDashboardTab('overview');
              handleNavigate('dashboard');
            }}
            onNavigatePlayground={() => handleNavigate('playground')}
          />
        )}
      </main>

      {/* Clean Footer matching autonomo.fun */}
      <footer className="border-t border-white/10 bg-[#0d0e12] py-8 px-4 sm:px-8 mb-14 md:mb-0">
        <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#a1a1aa]">
          <p>
            Service data comes from the Coinbase CDP and PayAI discovery
            endpoints and is refreshed regularly.
          </p>

          <div className="flex flex-wrap items-center gap-5 font-mono">
            <button
              type="button"
              onClick={() => handleNavigate('docs')}
              className="hover:text-white cursor-pointer"
            >
              Docs
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('projects')}
              className="hover:text-white cursor-pointer"
            >
              Explore APIs
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('playground')}
              className="hover:text-white cursor-pointer"
            >
              Playground
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('dashboard')}
              className="hover:text-white cursor-pointer"
            >
              Launch
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar (<768px, 5 items, >=44px hit targets) */}
      <nav
        aria-label="Mobile bottom navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0d0e12]/95 border-t border-white/10 px-2 py-1.5 flex items-center justify-around"
      >
        {(
          [
            { id: 'home', label: 'Home', icon: Home },
            { id: 'projects', label: 'Explore', icon: Compass },
            { id: 'playground', label: 'Playground', icon: Play },
            { id: 'dashboard', label: 'Launch', icon: LayoutDashboard },
            { id: 'docs', label: 'Docs', icon: BookOpen },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const active = route === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavigate(item.id)}
              className={`min-h-[44px] min-w-[56px] px-2 py-1 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
                active ? 'text-[#00C805]' : 'text-[#a1a1aa] hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Project & HTTP 402 Header Inspector Modal */}
      {renderInspectorModal()}
    </div>
  );
}

export default function App() {
  return (
    <RealtimeStoreProvider>
      <AutonomoShell />
    </RealtimeStoreProvider>
  );
}
