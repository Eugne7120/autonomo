import React, { useState, useEffect } from 'react';
import {
  Terminal,
  CheckCircle2,
  ArrowRight,
  Copy,
  Check,
  Sparkles,
  Lock,
} from 'lucide-react';
import { useRealtimeStore } from '../../lib/realtimeStore';
import { AutonomoProject, AUTONOMO_CONTRACT_ADDRESS } from '../../lib/data';
import { buildX402HeaderPayload } from '../../lib/math';
import { ZoftReactor3D } from '../circuit/ZoftReactor3D';

interface PlaygroundViewProps {
  initialQuery?: string;
  onNavigateDashboard: () => void;
  onInspectProject: (project: AutonomoProject) => void;
}

interface ExecutionTrace {
  question: string;
  matchedProject: AutonomoProject;
  endpointPath: string;
  paymentAsset: '$AUTONOMO' | 'USDG';
  amountPaid: string;
  headerBase64: string;
  decoded402: unknown;
  responsePayload: Record<string, unknown>;
  agentSummary: string;
  stage: '402_received' | 'signing' | 'settling' | 'completed';
}

export const PlaygroundView: React.FC<PlaygroundViewProps> = ({
  initialQuery = '',
  onNavigateDashboard,
  onInspectProject,
}) => {
  const { projects, recordSimulatedCall, triggerProofPulse } =
    useRealtimeStore();
  const [question, setQuestion] = useState(initialQuery);
  const [paymentAsset, setPaymentAsset] = useState<'$AUTONOMO' | 'USDG'>(
    '$AUTONOMO'
  );
  const [trace, setTrace] = useState<ExecutionTrace | null>(null);
  const [copiedHeader, setCopiedHeader] = useState(false);

  const officialApis = projects.filter((p) => p.officialRobinhood && p.category === 'service');

  const runAgentQuery = (qText: string) => {
    const trimmed = qText.trim();
    if (!trimmed) return;
    setQuestion(trimmed);

    const lower = trimmed.toLowerCase();
    let matched =
      projects.find((p) => p.slug === 'token-price') || projects[0];

    if (lower.includes('launch') || lower.includes('new') || lower.includes('bonding')) {
      matched =
        projects.find((p) => p.slug === 'new-launches') || matched;
    } else if (
      lower.includes('risk') ||
      lower.includes('safe') ||
      lower.includes('rug')
    ) {
      matched =
        projects.find((p) => p.slug === 'risk-checker') || matched;
    } else if (lower.includes('ax1') || lower.includes('verdict')) {
      matched =
        projects.find((p) => p.slug === 'ax1-console') || matched;
    } else {
      const customMatch = projects.find(
        (p) =>
          p.category === 'service' &&
          (lower.includes(p.name.toLowerCase()) ||
            lower.includes(p.slug.toLowerCase()))
      );
      if (customMatch) matched = customMatch;
    }

    const ep = matched.endpoints[0] || {
      method: 'GET' as const,
      path: `/x/${matched.slug}`,
      priceDisplay: matched.priceLabel,
      priceUsdg: matched.minPriceUsd || 0.01,
      priceAutonomo: 1000,
      network: 'eip155:4663 (Robinhood Chain)',
      scheme: 'permit2' as const,
      description: matched.description,
      sampleResponse: { status: '200 OK', project: matched.name },
    };

    const { json, base64Header } = buildX402HeaderPayload({
      slug: matched.slug,
      priceUsdg: ep.priceUsdg || 0.01,
      priceAutonomo: ep.priceAutonomo || 1000,
      network: 'eip155:4663',
      payTo: matched.payTo || AUTONOMO_CONTRACT_ADDRESS,
      description: ep.description,
    });

    const amountStr =
      paymentAsset === '$AUTONOMO'
        ? `${(ep.priceAutonomo || 1000).toLocaleString('en-US')}`
        : `${ep.priceUsdg || 0.01}`;

    let summaryText = `Agent discovered ${matched.name} (${ep.path}), verified the 402 price (${amountStr} ${paymentAsset} on Robinhood Chain), signed the ${paymentAsset === '$AUTONOMO' ? 'Permit2' : 'EIP-3009'} authorization, and received HTTP 200 OK.`;
    if (matched.slug === 'token-price') {
      summaryText = `$AUTONOMO is trading at $0.0000142 (+18.4% 24h) on Robinhood Chain with $412,800 liquidity depth and $189,400 24h volume. Paid ${amountStr} ${paymentAsset} via x402.`;
    } else if (matched.slug === 'new-launches') {
      summaryText = `Top newest Robinhood Chain launches: $HOODAI (100% graduated, $129.5K mcap), $ROBINX (91.4% bonding curve, $84.2K mcap), and $X402PAY (64.2% curve, $41.9K mcap). Paid ${amountStr} ${paymentAsset} via x402.`;
    } else if (matched.slug === 'risk-checker') {
      summaryText = `Rug-risk audit for $AUTONOMO (${AUTONOMO_CONTRACT_ADDRESS}): LOW RISK (12/100). Top 10 holders own 14.8%, creator wallet holds 1.2%, and 0.0% launch-block sniper bundles detected. Paid ${amountStr} ${paymentAsset} via x402.`;
    }

    setTrace({
      question: trimmed,
      matchedProject: matched,
      endpointPath: ep.path,
      paymentAsset,
      amountPaid: amountStr,
      headerBase64: base64Header,
      decoded402: json,
      responsePayload: ep.sampleResponse,
      agentSummary: summaryText,
      stage: 'completed',
    });

    triggerProofPulse();
    recordSimulatedCall({
      endpointPath: ep.path,
      projectName: matched.name,
      network: matched.networks[0] || 'Robinhood Chain',
      amountPaid: amountStr,
      asset: paymentAsset,
      agentId: 'playground-agent-0x8f2a',
      httpStatus: 200,
      latencyMs: 41,
      mode: 'Simulation',
    });
  };

  useEffect(() => {
    if (initialQuery) {
      runAgentQuery(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const handleCopyHeader = () => {
    if (!trace) return;
    navigator.clipboard?.writeText(trace.headerBase64);
    setCopiedHeader(true);
    setTimeout(() => setCopiedHeader(false), 1800);
  };

  return (
    <div className="py-8 space-y-10">
      {/* Header + 3D Visualizer Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-5 bg-[#0d0e12] border border-white/10 rounded-2xl p-6 sm:p-7">
          <div className="space-y-2">
            <span className="text-xs font-mono text-[#00C805]">
              Preview · Interactive x402 Playground
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#f4f4f6]">
              Agent Playground
            </h1>
            <p className="text-sm sm:text-base text-[#a1a1aa] leading-relaxed">
              Ask a question and watch an AI agent find a paid API on Autonomo,
              read its live <code className="text-[#f4f4f6]">402 Payment Required</code>{' '}
              header, and pay for it in{' '}
              <span className="text-white font-medium">$AUTONOMO</span> or{' '}
              <span className="text-white font-medium">USDG</span> on Robinhood
              Chain.
            </p>
          </div>

          {/* Settlement Token Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <span className="text-xs font-mono text-[#a1a1aa]">
              Agent Settlement Asset (Robinhood Chain eip155:4663)
            </span>
            <div
              className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#12141b] border border-white/10"
              role="group"
              aria-label="Select settlement token"
            >
              {(['$AUTONOMO', 'USDG'] as const).map((token) => (
                <button
                  key={token}
                  type="button"
                  onClick={() => setPaymentAsset(token)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                    paymentAsset === token
                      ? 'bg-[#00C805] text-[#070709] font-semibold'
                      : 'text-[#a1a1aa] hover:text-white'
                  }`}
                >
                  {token === '$AUTONOMO'
                    ? '$AUTONOMO (Permit2)'
                    : 'USDG (EIP-3009)'}
                </button>
              ))}
            </div>
          </div>

          {/* Question Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runAgentQuery(question);
            }}
            className="flex flex-col sm:flex-row gap-2.5"
          >
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything, e.g. What's the current price of $AUTONOMO?"
              aria-label="Your question"
              className="flex-1 px-4 py-3 rounded-xl bg-[#12141b] border border-white/15 text-sm text-[#f4f4f6] placeholder:text-[#8b8b97] focus:outline-none focus:border-white/40"
            />
            <button
              type="submit"
              disabled={!question.trim()}
              className="px-6 py-3 rounded-xl bg-[#00C805] text-[#070709] font-semibold text-sm hover:bg-[#10b981] disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap cursor-pointer"
            >
              Ask Agent
            </button>
          </form>

          {/* Preset Prompts */}
          <div className="space-y-2 pt-1">
            <div className="text-xs font-mono text-[#8b8b97]">Try one:</div>
            <div className="flex flex-wrap gap-2">
              {[
                "What's the current price of $AUTONOMO?",
                'What are the newest token launches?',
                'Is $AUTONOMO safe? Run a rug-risk check',
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => runAgentQuery(preset)}
                  className="px-3.5 py-2 rounded-xl bg-[#12141b] hover:bg-[#20232b] border border-white/10 text-xs text-[#d4d4d8] transition-colors text-left cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: 3D x402 Payment Visualizer */}
        <div className="lg:col-span-5 bg-[#0d0e12] border border-white/10 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#f4f4f6]">
                3D x402 Handshake &amp; Settlement Engine
              </h2>
              <p className="text-xs text-[#a1a1aa]">
                Pulses on each HTTP 402 → signature → 200 OK handshake
              </p>
            </div>
            <span className="text-xs font-mono text-[#00C805]">
              Robinhood Chain
            </span>
          </div>
          <ZoftReactor3D tier="compact" interactiveControls={true} />
        </div>
      </div>

      {/* Live Execution Trace Output */}
      {trace && (
        <section
          aria-label="x402 Execution Trace"
          className="p-6 sm:p-7 rounded-2xl bg-[#0d0e12] border border-[#00C805]/40 space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#00C805]" />
              <h2 className="font-display text-xl font-bold text-[#f4f4f6]">
                x402 Payment Handshake Complete · {trace.matchedProject.name}
              </h2>
            </div>
            <span className="text-xs font-mono text-[#a1a1aa] tabular-nums">
              Paid {trace.amountPaid} {trace.paymentAsset} · Robinhood Chain
              (eip155:4663) · Simulation
            </span>
          </div>

          {/* 4-Step Protocol Trace Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#12141b] border border-white/10 space-y-1.5">
              <div className="text-xs font-mono text-[#f59e0b]">
                Step 01 · HTTP 402
              </div>
              <div className="text-sm font-semibold text-[#f4f4f6]">
                GET {trace.endpointPath}
              </div>
              <p className="text-xs text-[#a1a1aa]">
                Gateway responds <code className="text-white">402 Payment Required</code>{' '}
                with <code className="text-white">PAYMENT-REQUIRED</code> header.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#12141b] border border-white/10 space-y-1.5">
              <div className="text-xs font-mono text-[#38bdf8]">
                Step 02 · Agent Signs
              </div>
              <div className="text-sm font-semibold text-[#f4f4f6]">
                {trace.paymentAsset === '$AUTONOMO'
                  ? 'Permit2 Signature'
                  : 'EIP-3009 Signature'}
              </div>
              <p className="text-xs text-[#a1a1aa]">
                Agent signs gasless authorization for {trace.amountPaid}{' '}
                {trace.paymentAsset} and retries with{' '}
                <code className="text-white">PAYMENT-SIGNATURE</code>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#12141b] border border-white/10 space-y-1.5">
              <div className="text-xs font-mono text-[#00C805]">
                Step 03 · Facilitator
              </div>
              <div className="text-sm font-semibold text-[#f4f4f6]">
                On-Chain Verification
              </div>
              <p className="text-xs text-[#a1a1aa]">
                {trace.matchedProject.facilitator} verifies signature and settles
                to <code className="text-white">payTo</code> wallet.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#12141b] border border-white/10 space-y-1.5">
              <div className="text-xs font-mono text-[#10b981]">
                Step 04 · HTTP 200 OK
              </div>
              <div className="text-sm font-semibold text-[#f4f4f6]">
                Verified Data Delivered
              </div>
              <p className="text-xs text-[#a1a1aa]">
                Upstream API responds 200 OK and agent synthesizes the answer
                below.
              </p>
            </div>
          </div>

          {/* Agent Synthesized Answer + Raw JSON Payload */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 p-5 rounded-xl bg-[#12141b] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#00C805] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Agent Response</span>
                </span>
                <span className="text-xs font-mono text-[#8b8b97]">
                  Query: &ldquo;{trace.question}&rdquo;
                </span>
              </div>
              <p className="text-sm sm:text-base text-[#f4f4f6] leading-relaxed">
                {trace.agentSummary}
              </p>
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono text-[#8b8b97]">
                <span>Recipient: {trace.matchedProject.payTo.slice(0, 14)}...</span>
                <button
                  type="button"
                  onClick={handleCopyHeader}
                  className="text-[#d4d4d8] hover:text-white inline-flex items-center gap-1 cursor-pointer"
                >
                  {copiedHeader ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#00C805]" />
                      <span>Copied 402 Header</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy PAYMENT-REQUIRED Base64</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="lg:col-span-6 p-5 rounded-xl bg-[#08090c] border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-[#a1a1aa]">
                <span>HTTP/1.1 200 OK · JSON Payload</span>
                <span className="text-[#00C805]">{trace.endpointPath}</span>
              </div>
              <pre className="text-xs font-mono text-[#d4d4d8] overflow-x-auto leading-relaxed">
                {JSON.stringify(trace.responsePayload, null, 2)}
              </pre>
            </div>
          </div>
        </section>
      )}

      {/* Official APIs the Agent Can Use Right Now */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="font-display text-2xl font-bold text-[#f4f4f6]">
            APIs the agent can use right now
          </h2>
          <span className="text-xs font-mono text-[#00C805]">
            {officialApis.length} live on Robinhood Chain · paid in $AUTONOMO or
            USDG
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {officialApis.map((api) => {
            const promptMap: Record<string, string> = {
              'token-price': "What's the current price of $AUTONOMO?",
              'new-launches': 'What are the newest token launches?',
              'risk-checker': 'Is $AUTONOMO safe? Run a rug-risk check',
            };
            const promptText =
              promptMap[api.slug] ||
              `Call ${api.name} (${api.host}) and summarize its live response.`;

            return (
              <div
                key={api.id}
                className="p-5 rounded-2xl bg-[#0d0e12] border border-white/10 flex flex-col justify-between gap-5"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onInspectProject(api)}
                      className="font-display text-lg font-semibold text-[#f4f4f6] hover:text-[#00C805] transition-colors cursor-pointer text-left"
                    >
                      {api.name}
                    </button>
                    <span className="text-xs font-mono text-[#00C805]">
                      Live
                    </span>
                  </div>
                  <p className="text-xs text-[#a1a1aa] leading-relaxed">
                    {api.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#d4d4d8] pt-1">
                    <span>1,000 $AUTONOMO</span>
                    <span aria-hidden="true">·</span>
                    <span>0.01 USDG</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#8b8b97]">/x/{api.slug}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => runAgentQuery(promptText)}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-[#12141b] hover:bg-[#20232b] border border-white/10 text-xs font-medium text-[#f4f4f6] flex items-center justify-between gap-2 transition-colors cursor-pointer"
                >
                  <span className="truncate">Ask: &ldquo;{promptText}&rdquo;</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#00C805] shrink-0" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="p-5 rounded-2xl bg-[#0d0e12] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Terminal className="w-5 h-5 text-[#00C805] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-sm font-semibold text-[#f4f4f6]">
                Built an API? Launch it on Autonomo
              </div>
              <p className="text-xs text-[#a1a1aa]">
                Accept $AUTONOMO and USDG on Robinhood Chain with zero code
                changes, and autonomous agents in the Playground can discover and
                call it immediately.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateDashboard}
            className="px-4 py-2.5 rounded-xl bg-white text-[#070709] text-xs font-semibold hover:bg-[#d4d4d8] transition-colors whitespace-nowrap cursor-pointer"
          >
            Launch your API →
          </button>
        </div>
      </section>
    </div>
  );
};
