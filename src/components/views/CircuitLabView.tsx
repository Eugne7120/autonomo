import React, { useState } from 'react';
import { ArrowRight, Play, Layers } from 'lucide-react';
import { useRealtimeStore } from '../../lib/realtimeStore';
import {
  CIRCUIT_LAB_NODES,
  CircuitNodeSpec,
  USE_CASE_PRESETS,
} from '../../lib/data';
import { calculateJoinSplit } from '../../lib/math';
import { ZoftReactor3D } from '../circuit/ZoftReactor3D';
import { IsometricBrickStrip } from '../circuit/IsometricBrickStrip';

interface CircuitLabViewProps {
  onOpenTransfer: () => void;
}

export const CircuitLabView: React.FC<CircuitLabViewProps> = ({
  onOpenTransfer,
}) => {
  const {
    circuitConfig,
    updateCircuitConfig,
    applyPreset,
    triggerProofPulse,
  } = useRealtimeStore();

  const [selectedNodeId, setSelectedNodeId] =
    useState<CircuitNodeSpec['id']>('reactor');

  const selectedNode =
    CIRCUIT_LAB_NODES.find((n) => n.id === selectedNodeId) ||
    CIRCUIT_LAB_NODES[2];

  const splitResult = calculateJoinSplit(
    circuitConfig.amountInput,
    circuitConfig.withdrawalSplitPercent
  );

  return (
    <div className="py-8 space-y-6">
      {/* Header & Top Preset Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#0d0e12] border border-white/10 rounded-2xl p-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#00C805]">
            <span>Advanced / Simulation</span>
            <span aria-hidden="true">·</span>
            <span>zOFT Protocol &amp; x402 Circuit Configurator</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#f4f4f6] mt-0.5">
            3D Join-Split &amp; State-Read Circuit Lab
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {USE_CASE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-colors cursor-pointer ${
                circuitConfig.withdrawalSplitPercent === preset.splitPercent
                  ? 'bg-white text-[#070709] font-semibold'
                  : 'bg-[#12141b] text-[#d4d4d8] border border-white/10 hover:border-white/30'
              }`}
            >
              {preset.title.split(' ')[0]} ({preset.splitPercent}%)
            </button>
          ))}

          <button
            type="button"
            onClick={triggerProofPulse}
            className="px-3.5 py-1.5 rounded-xl bg-[#00C805] text-[#070709] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#10b981] cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Simulate Circuit Pulse</span>
          </button>
        </div>
      </div>

      {/* Main Bounded Circuit Board + Single Active Node Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Bounded Dot-Matrix Node Board + Lab 3D Reactor */}
        <div className="lg:col-span-8 rounded-2xl bg-[#08090c] border border-white/10 p-5 dot-grid-canvas space-y-5">
          {/* Directional 5-Node Flow Strip */}
          <div
            className="grid grid-cols-1 sm:grid-cols-5 gap-2.5"
            role="tablist"
            aria-label="Circuit lab pipeline nodes"
          >
            {CIRCUIT_LAB_NODES.map((node) => {
              const isSelected = node.id === selectedNodeId;
              return (
                <button
                  key={node.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'bg-[#161820] border-white/50 shadow-sm'
                      : 'bg-[#0d0e12]/90 border-white/10 hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#00C805] font-semibold">
                      {node.stepNumber}
                    </span>
                    <span className="text-[#8b8b97]">Node</span>
                  </div>
                  <div className="font-display text-xs font-semibold text-[#f4f4f6] leading-snug">
                    {node.title}
                  </div>
                  <div className="text-[10px] font-mono text-[#a1a1aa] truncate">
                    {node.statusLabel}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Expanded 3D Noir Reactor inside Bounded Lab Board */}
          <ZoftReactor3D tier="lab" interactiveControls={true} />

          {/* Directional SVG Signal Flow Summary Bar */}
          <div className="p-3.5 rounded-xl bg-[#0d0e12]/95 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 text-[#d4d4d8]">
              <Layers className="w-4 h-4 text-[#00C805]" />
              <span>
                Active Node: {selectedNode.stepNumber}. {selectedNode.title}
              </span>
            </div>
            <div className="text-[#a1a1aa] tabular-nums">
              {circuitConfig.selectedNoteIds.length} UTXO Notes →{' '}
              <span className="text-[#00C805]">
                {circuitConfig.withdrawalSplitPercent}% Intent
              </span>{' '}
              / {100 - circuitConfig.withdrawalSplitPercent}% Change →{' '}
              {circuitConfig.selectedComposeRoute}
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Focused Single-Node Inspector */}
        <aside
          aria-label="Selected Circuit Node Inspector"
          className="lg:col-span-4 rounded-2xl bg-[#0d0e12] border border-white/10 p-5 space-y-5"
        >
          <div className="border-b border-white/10 pb-4 space-y-1">
            <div className="text-xs font-mono text-[#00C805]">
              Node {selectedNode.stepNumber} Inspector · {selectedNode.statusLabel}
            </div>
            <h2 className="font-display text-xl font-bold text-[#f4f4f6]">
              {selectedNode.title}
            </h2>
            <p className="text-xs text-[#a1a1aa] leading-relaxed">
              {selectedNode.description}
            </p>
          </div>

          {/* Node-Specific Interactive Controls */}
          {selectedNodeId === 'vault' && (
            <div className="space-y-4 text-xs">
              <div>
                <label
                  htmlFor="lab-source-chain"
                  className="block text-[#d4d4d8] mb-1.5"
                >
                  Source Vault Chain (Conceptual)
                </label>
                <select
                  id="lab-source-chain"
                  value={circuitConfig.sourceChainId || 4663}
                  onChange={(e) =>
                    updateCircuitConfig({
                      sourceChainId: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#12141b] border border-white/12 font-mono text-[#f4f4f6]"
                >
                  <option value={4663}>Robinhood Chain (eip155:4663)</option>
                  <option value={8453}>Base (eip155:8453)</option>
                  <option value={42161}>Arbitrum (eip155:42161)</option>
                </select>
              </div>

              <div className="p-3.5 rounded-xl bg-[#12141b] border border-white/10 space-y-1.5">
                <div className="font-mono text-[#d4d4d8]">
                  0xbow ASP Association Status
                </div>
                <p className="text-[#a1a1aa] leading-relaxed">
                  Status: <span className="text-white">Illustrative</span>.
                  Association Set membership is enforced by protocol circuits and
                  cannot be bypassed via UI toggles.
                </p>
              </div>
            </div>
          )}

          {selectedNodeId === 'notes' && (
            <div className="space-y-4 text-xs">
              <div>
                <label
                  htmlFor="lab-note-count"
                  className="block text-[#d4d4d8] mb-1.5"
                >
                  Consolidated Input UTXO Notes
                </label>
                <select
                  id="lab-note-count"
                  value={circuitConfig.selectedNoteIds.length}
                  onChange={(e) => {
                    const c = Number(e.target.value);
                    updateCircuitConfig({
                      selectedNoteIds: [
                        'note-01',
                        'note-02',
                        'note-03',
                        'note-04',
                      ].slice(0, c),
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-[#12141b] border border-white/12 font-mono text-[#f4f4f6]"
                >
                  <option value={1}>1 UTXO Note</option>
                  <option value={2}>2 UTXO Notes</option>
                  <option value={3}>3 UTXO Notes</option>
                  <option value={4}>4 UTXO Notes</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="lab-total-amount"
                  className="block text-[#d4d4d8] mb-1.5"
                >
                  Combined Note Value ({circuitConfig.assetId || 'USDG'})
                </label>
                <input
                  id="lab-total-amount"
                  type="text"
                  value={circuitConfig.amountInput}
                  onChange={(e) =>
                    updateCircuitConfig({ amountInput: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#12141b] border border-white/12 font-mono text-[#f4f4f6] tabular-nums"
                />
              </div>
            </div>
          )}

          {selectedNodeId === 'reactor' && (
            <div className="space-y-4">
              <IsometricBrickStrip
                valuePercent={circuitConfig.withdrawalSplitPercent}
                onChangePercent={(val) =>
                  updateCircuitConfig({ withdrawalSplitPercent: val })
                }
                label="Join-Split Partition"
              />
            </div>
          )}

          {selectedNodeId === 'lzread' && (
            <div className="space-y-4 text-xs">
              <div>
                <label
                  htmlFor="lab-batch-density"
                  className="block text-[#d4d4d8] mb-1.5"
                >
                  Solver Batch Density Preview ({circuitConfig.solverBatchSizePreview}{' '}
                  commitments)
                </label>
                <input
                  id="lab-batch-density"
                  type="range"
                  min={2}
                  max={24}
                  value={circuitConfig.solverBatchSizePreview}
                  onChange={(e) =>
                    updateCircuitConfig({
                      solverBatchSizePreview: Number(e.target.value),
                    })
                  }
                  className="w-full accent-[#00C805]"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-[#12141b] border border-white/10 space-y-1 font-mono">
                <div className="text-[#f59e0b]">
                  LayerZero V2 lzRead: {circuitConfig.lzReadDisplayStatus}
                </div>
                <div className="text-[#a1a1aa]">
                  Retrieves source vault Merkle root across chains for
                  zero-knowledge verification.
                </div>
              </div>
            </div>
          )}

          {selectedNodeId === 'destination' && (
            <div className="space-y-4 text-xs">
              <div>
                <label
                  htmlFor="lab-compose-route"
                  className="block text-[#d4d4d8] mb-1.5"
                >
                  Stealth Destination / lzCompose Target
                </label>
                <select
                  id="lab-compose-route"
                  value={circuitConfig.selectedComposeRoute}
                  onChange={(e) =>
                    updateCircuitConfig({
                      selectedComposeRoute: e.target
                        .value as typeof circuitConfig.selectedComposeRoute,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#12141b] border border-white/12 font-mono text-[#f4f4f6]"
                >
                  <option value="direct">Direct ERC-5564 Stealth Address</option>
                  <option value="aave-v3">lzCompose → Aave V3 Supply</option>
                  <option value="uniswap-v4">lzCompose → Uniswap v4 Swap</option>
                  <option value="pendle-pt">lzCompose → Pendle PT Vault</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="lab-gas-drop"
                  className="block text-[#d4d4d8] mb-1.5"
                >
                  Optional Native Gas Drop (ETH)
                </label>
                <input
                  id="lab-gas-drop"
                  type="text"
                  value={circuitConfig.nativeGasDropInput}
                  onChange={(e) =>
                    updateCircuitConfig({ nativeGasDropInput: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#12141b] border border-white/12 font-mono text-[#f4f4f6] tabular-nums"
                />
              </div>
            </div>
          )}

          {/* Persistent Arithmetic Summary & Carry-over CTA */}
          <div className="pt-4 border-t border-white/10 space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-[#a1a1aa]">Intent Output (Before fees)</span>
              <span className="font-mono font-semibold text-[#00C805] tabular-nums">
                {splitResult.intentFormatted} {circuitConfig.assetId || 'USDG'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#a1a1aa]">Shielded Change</span>
              <span className="font-mono text-[#d4d4d8] tabular-nums">
                {splitResult.changeFormatted} {circuitConfig.assetId || 'USDG'}
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenTransfer}
              className="w-full py-2.5 px-4 rounded-xl bg-white text-[#070709] font-semibold text-xs hover:bg-[#d4d4d8] transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Carry Configuration to Private Transfer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
