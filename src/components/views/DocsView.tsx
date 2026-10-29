import React, { useState } from 'react';
import { Copy, Check, Play, Terminal } from 'lucide-react';
import {
  AUTONOMO_CONTRACT_ADDRESS,
  PERMIT2_CONTRACT_ADDRESS,
} from '../../lib/data';
import { useRealtimeStore } from '../../lib/realtimeStore';

interface DocsViewProps {
  onNavigateDashboard: () => void;
  onNavigatePlayground: () => void;
}

const EXPRESS_SNIPPET = `import express from "express";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";

const app = express();
const payTo = "0xYourWalletAddress"; // where payments land

const facilitator = new HTTPFacilitatorClient({
  url: "https://x402.org/facilitator",
});

app.use(
  paymentMiddleware(
    {
      "GET /weather": {
        accepts: [{ scheme: "exact", price: "$0.001", network: "eip155:84532", payTo }],
        description: "Current weather for a city",
        mimeType: "application/json",
      },
    },
    new x402ResourceServer(facilitator).register("eip155:84532", new ExactEvmScheme()),
  ),
);

app.get("/weather", (req, res) => {
  res.json({ city: "Lisbon", weather: "sunny", tempC: 24 });
});

app.listen(4021);`;

const AGENT_FETCH_SNIPPET = `import { wrapFetchWithPayment } from "@x402/fetch";
import { x402Client } from "@x402/core/client";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

// A dedicated agent wallet holding USDG or $AUTONOMO on Robinhood Chain
const signer = privateKeyToAccount(process.env.AGENT_PRIVATE_KEY as \`0x\${string}\`);
const client = new x402Client();
client.register("eip155:*", new ExactEvmScheme(signer));

const fetchWithPayment = wrapFetchWithPayment(fetch, client);

// Pays automatically when the API answers 402, then retries
const res = await fetchWithPayment("https://autonomo.fun/x/token-price");
console.log(await res.json());`;

export const DocsView: React.FC<DocsViewProps> = ({
  onNavigateDashboard,
  onNavigatePlayground,
}) => {
  const { projects } = useRealtimeStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedEndpointTest, setSelectedEndpointTest] = useState<
    'projects' | 'slug' | 'stats'
  >('projects');

  const copyText = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const getTestApiOutput = () => {
    if (selectedEndpointTest === 'projects') {
      return {
        endpoint: 'GET /api/v1/projects?network=robinhood&limit=3',
        status: '200 OK · Open CORS · Free Discovery',
        data: projects.slice(0, 3).map((p) => ({
          slug: p.slug,
          name: p.name,
          category: p.category,
          networks: p.networks,
          minPriceUsd: p.minPriceUsd,
          calls30d: p.calls30d,
        })),
      };
    }
    if (selectedEndpointTest === 'slug') {
      const p = projects[0];
      return {
        endpoint: `GET /api/v1/projects/${p.slug}`,
        status: '200 OK',
        project: {
          name: p.name,
          host: p.host,
          facilitator: p.facilitator,
          payTo: p.payTo,
          endpoints: p.endpoints,
        },
      };
    }
    return {
      endpoint: 'GET /api/v1/stats',
      status: '200 OK',
      totals: {
        projects: 3742,
        paidEndpoints: 107714,
        paidCalls30d: 894420,
        categories: {
          service: 3711,
          facilitator: 16,
          sdk: 4,
          extension: 6,
          explorer: 5,
        },
      },
    };
  };

  return (
    <div className="py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sticky Docs Sidebar */}
        <aside className="lg:col-span-3 bg-[#0d0e12] border border-white/10 rounded-2xl p-5 space-y-3 lg:sticky lg:top-24">
          <h2 className="text-xs font-mono text-[#00C805] uppercase tracking-wider">
            On this page
          </h2>
          <nav className="flex flex-col space-y-1.5 text-xs">
            {[
              { href: '#overview', label: 'Overview' },
              { href: '#how-x402-works', label: 'How x402 works' },
              { href: '#launch', label: 'Launch your API' },
              { href: '#agents', label: 'Connect your agent' },
              { href: '#api', label: 'Interactive API reference' },
              { href: '#pro', label: 'Pro API & Robinhood Chain' },
              { href: '#token', label: '$AUTONOMO token & Permit2' },
              { href: '#roadmap', label: 'Roadmap & status' },
              { href: '#faq', label: 'FAQ' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="py-1.5 px-2.5 rounded-lg text-[#d4d4d8] hover:text-white hover:bg-[#161820] transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Main Documentation Content */}
        <article className="lg:col-span-9 space-y-12">
          {/* Overview */}
          <section
            id="overview"
            className="p-6 sm:p-8 rounded-2xl bg-[#0d0e12] border border-white/10 space-y-4"
          >
            <span className="text-xs font-mono text-[#00C805]">
              Documentation · Autonomo x402 Protocol
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#f4f4f6]">
              Launch an API agents pay for
            </h1>
            <p className="text-sm sm:text-base text-[#d4d4d8] leading-relaxed max-w-[65ch]">
              Autonomo is the agentic x402 launchpad for APIs. You put a price on
              an endpoint with x402, launch it here, and AI agents can find it
              and pay for each call in stablecoins or{' '}
              <code className="text-white">$AUTONOMO</code>. Agents need no API
              keys, accounts or invoices.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <button
                type="button"
                onClick={onNavigateDashboard}
                className="p-4 rounded-xl bg-[#12141b] hover:bg-[#161820] border border-white/10 text-left space-y-1 cursor-pointer"
              >
                <div className="font-display font-semibold text-sm text-[#00C805]">
                  I have an API →
                </div>
                <div className="text-xs text-[#a1a1aa]">
                  Charge agents per call via hosted gateway or middleware.
                </div>
              </button>

              <button
                type="button"
                onClick={onNavigatePlayground}
                className="p-4 rounded-xl bg-[#12141b] hover:bg-[#161820] border border-white/10 text-left space-y-1 cursor-pointer"
              >
                <div className="font-display font-semibold text-sm text-[#f4f4f6]">
                  I&apos;m building an agent →
                </div>
                <div className="text-xs text-[#a1a1aa]">
                  Find paid APIs and pay for them automatically in the
                  Playground.
                </div>
              </button>
            </div>
          </section>

          {/* How x402 works */}
          <section
            id="how-x402-works"
            className="p-6 sm:p-8 rounded-2xl bg-[#0d0e12] border border-white/10 space-y-4"
          >
            <h2 className="font-display text-2xl font-bold text-[#f4f4f6]">
              How x402 works
            </h2>
            <p className="text-sm text-[#d4d4d8]">
              x402 uses the HTTP status code{' '}
              <code className="text-[#00C805]">402 Payment Required</code>.
              Payment happens inside a standard HTTP request:
            </p>
            <ol className="space-y-2.5 text-sm text-[#a1a1aa] list-decimal pl-5">
              <li>The autonomous agent calls your HTTP endpoint.</li>
              <li>
                Your server or Autonomo gateway answers <code className="text-white">402</code>{' '}
                with a <code className="text-white">PAYMENT-REQUIRED</code>{' '}
                header specifying price, network, and your{' '}
                <code className="text-white">payTo</code> wallet.
              </li>
              <li>
                The agent signs an EIP-3009 (USDG/USDC) or Permit2 ($AUTONOMO)
                payment authorization and retries with a{' '}
                <code className="text-white">PAYMENT-SIGNATURE</code> header.
              </li>
              <li>
                A facilitator verifies and settles the payment on-chain, and
                your server returns the HTTP 200 payload.
              </li>
            </ol>
          </section>

          {/* Launch your API */}
          <section
            id="launch"
            className="p-6 sm:p-8 rounded-2xl bg-[#0d0e12] border border-white/10 space-y-5"
          >
            <h2 className="font-display text-2xl font-bold text-[#f4f4f6]">
              Launch your API (Express / Node.js Quickstart)
            </h2>
            <p className="text-sm text-[#a1a1aa]">
              Launch without code using our Hosted Gateway on the Dashboard, or
              add <code className="text-white">@x402/express</code> directly to
              your server:
            </p>

            <div className="rounded-xl bg-[#08090c] border border-white/10 overflow-hidden">
              <div className="px-4 py-2 bg-[#12141b] border-b border-white/10 flex items-center justify-between text-xs font-mono text-[#a1a1aa]">
                <span>server.ts · @x402/express</span>
                <button
                  type="button"
                  onClick={() => copyText('express', EXPRESS_SNIPPET)}
                  className="text-[#d4d4d8] hover:text-white inline-flex items-center gap-1 cursor-pointer"
                >
                  {copiedId === 'express' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#00C805]" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-[#d4d4d8] overflow-x-auto leading-relaxed">
                {EXPRESS_SNIPPET}
              </pre>
            </div>
          </section>

          {/* Connect your agent */}
          <section
            id="agents"
            className="p-6 sm:p-8 rounded-2xl bg-[#0d0e12] border border-white/10 space-y-5"
          >
            <h2 className="font-display text-2xl font-bold text-[#f4f4f6]">
              Connect your agent (@x402/fetch + viem)
            </h2>
            <p className="text-sm text-[#a1a1aa]">
              Wrap standard <code className="text-white">fetch</code> with an
              x402 client so your agent automatically signs and retries on HTTP
              402 responses:
            </p>

            <div className="rounded-xl bg-[#08090c] border border-white/10 overflow-hidden">
              <div className="px-4 py-2 bg-[#12141b] border-b border-white/10 flex items-center justify-between text-xs font-mono text-[#a1a1aa]">
                <span>agent.ts · @x402/fetch</span>
                <button
                  type="button"
                  onClick={() => copyText('agent', AGENT_FETCH_SNIPPET)}
                  className="text-[#d4d4d8] hover:text-white inline-flex items-center gap-1 cursor-pointer"
                >
                  {copiedId === 'agent' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#00C805]" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-[#d4d4d8] overflow-x-auto leading-relaxed">
                {AGENT_FETCH_SNIPPET}
              </pre>
            </div>
          </section>

          {/* Interactive API Reference */}
          <section
            id="api"
            className="p-6 sm:p-8 rounded-2xl bg-[#0d0e12] border border-white/10 space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-2xl font-bold text-[#f4f4f6]">
                  Interactive Discovery API Reference
                </h2>
                <p className="text-xs text-[#a1a1aa] mt-0.5">
                  Read-only JSON, free in beta with open CORS. Click an endpoint
                  to inspect its live response.
                </p>
              </div>
              <Terminal className="w-5 h-5 text-[#00C805]" />
            </div>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: 'projects', label: 'GET /api/v1/projects' },
                  { id: 'slug', label: 'GET /api/v1/projects/{slug}' },
                  { id: 'stats', label: 'GET /api/v1/stats' },
                ] as const
              ).map((ep) => (
                <button
                  key={ep.id}
                  type="button"
                  onClick={() => setSelectedEndpointTest(ep.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono inline-flex items-center gap-1.5 cursor-pointer ${
                    selectedEndpointTest === ep.id
                      ? 'bg-[#00C805] text-[#070709] font-semibold'
                      : 'bg-[#12141b] text-[#d4d4d8] border border-white/10'
                  }`}
                >
                  <Play className="w-3 h-3" />
                  <span>{ep.label}</span>
                </button>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-[#08090c] border border-white/10">
              <pre className="text-xs font-mono text-[#d4d4d8] overflow-x-auto leading-relaxed">
                {JSON.stringify(getTestApiOutput(), null, 2)}
              </pre>
            </div>
          </section>

          {/* Robinhood Chain USDG & $AUTONOMO */}
          <section
            id="pro"
            className="p-6 sm:p-8 rounded-2xl bg-[#0d0e12] border border-white/10 space-y-4"
          >
            <h2
              id="token"
              className="font-display text-2xl font-bold text-[#f4f4f6]"
            >
              Paying with USDG &amp; $AUTONOMO on Robinhood Chain
            </h2>
            <p className="text-sm text-[#a1a1aa] leading-relaxed">
              <strong className="text-white">USDG (Global Dollar)</strong> on
              Robinhood Chain supports EIP-3009, so each payment is a single
              signature with no approval step and zero gas for the agent.
            </p>
            <p className="text-sm text-[#a1a1aa] leading-relaxed">
              <strong className="text-white">$AUTONOMO</strong> payments run on
              Robinhood Chain through Permit2 (
              <code className="text-[#d4d4d8]">{PERMIT2_CONTRACT_ADDRESS}</code>
              ). After a one-time Permit2 approval, every call is a gasless
              signature.
            </p>

            <div className="p-4 rounded-xl bg-[#12141b] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs text-[#8b8b97]">
                  Official $AUTONOMO Contract Address
                </div>
                <code className="text-xs sm:text-sm font-mono text-[#00C805] break-all">
                  {AUTONOMO_CONTRACT_ADDRESS}
                </code>
              </div>
              <button
                type="button"
                onClick={() => copyText('ca-docs', AUTONOMO_CONTRACT_ADDRESS)}
                className="px-3.5 py-2 rounded-lg bg-white text-[#070709] text-xs font-semibold hover:bg-[#d4d4d8] whitespace-nowrap cursor-pointer"
              >
                {copiedId === 'ca-docs' ? 'Copied Address' : 'Copy Contract'}
              </button>
            </div>
          </section>

            {/* Roadmap & FAQ */}
          <section
            id="roadmap"
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="p-6 rounded-2xl bg-[#0d0e12] border border-white/10 space-y-3">
              <h2 className="font-display text-xl font-bold text-[#f4f4f6]">
                Roadmap &amp; Status
              </h2>
              <ul className="space-y-2.5 text-xs text-[#a1a1aa]">
                <li>
                  <span className="text-[#00C805] font-mono font-semibold">
                    Phase 1 · Live:
                  </span>{' '}
                  Hosted x402 gateways, USDG &amp; $AUTONOMO settlement on
                  Robinhood Chain, Agent Playground, and 3 official APIs (Token
                  Price, New Launches, Risk Checker).
                </li>
                <li>
                  <span className="text-[#f59e0b] font-mono font-semibold">
                    Phase 2 · Building Now:
                  </span>{' '}
                  Telegram agent bot (@autonomoagentbot ✓ Complete), Autonomo
                  MCP server, Agent SDK with spend limits, and payout webhooks.
                </li>
                <li>
                  <span className="text-[#38bdf8] font-mono font-semibold">
                    Phase 3 · Next:
                  </span>{' '}
                  API creator analytics, uptime badges, reputation scores, and
                  pay-with-$AUTONOMO fee discounts across hosted gateways.
                </li>
              </ul>
            </div>

            <div
              id="faq"
              className="p-6 rounded-2xl bg-[#0d0e12] border border-white/10 space-y-3"
            >
              <h2 className="font-display text-xl font-bold text-[#f4f4f6]">
                Frequently Asked Questions
              </h2>
              <dl className="space-y-2.5 text-xs">
                <div>
                  <dt className="font-semibold text-[#f4f4f6]">
                    Does Autonomo take a cut of payments?
                  </dt>
                  <dd className="text-[#a1a1aa] mt-0.5">
                    No. Agents pay your <code>payTo</code> wallet directly
                    through the facilitator; Autonomo never holds or routes
                    listed API funds.
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-[#f4f4f6]">
                    What happens if my upstream API fails or times out?
                  </dt>
                  <dd className="text-[#a1a1aa] mt-0.5">
                    On Hosted Gateways (<code>autonomo.fun/x/your-api</code>),
                    the payment is settled on-chain only when your upstream
                    server returns an HTTP status below 400.
                  </dd>
                </div>
              </dl>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
};
