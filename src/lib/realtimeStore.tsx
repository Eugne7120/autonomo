import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AutonomoProject,
  INITIAL_PROJECTS,
  ZoftCircuitConfig,
  USE_CASE_PRESETS,
  AUTONOMO_CONTRACT_ADDRESS,
} from './data';
import { buildX402HeaderPayload } from './math';

export interface RealtimeCallEvent {
  id: string;
  timestamp: string;
  endpointPath: string;
  projectName: string;
  network: string;
  amountPaid: string;
  asset: 'USDG' | '$AUTONOMO' | 'USDC';
  agentId: string;
  httpStatus: 200 | 402;
  latencyMs: number;
  mode: 'Sample' | 'Simulation';
}

export interface ShieldedNote {
  id: string;
  label: string;
  asset: 'USDC' | 'USDG' | '$AUTONOMO';
  amount: string;
  chainName: string;
  commitmentShort: string;
  isSample: boolean;
}

interface RealtimeStoreContextValue {
  projects: AutonomoProject[];
  callEvents: RealtimeCallEvent[];
  notes: ShieldedNote[];
  circuitConfig: ZoftCircuitConfig;
  balancesHidden: boolean;
  reducedMotion: boolean;
  walletConnected: boolean;
  walletAddress: string;
  activeNetwork: string;
  proofPulseCounter: number;
  setBalancesHidden: (val: boolean) => void;
  setReducedMotion: (val: boolean) => void;
  toggleWallet: () => void;
  setActiveNetwork: (net: string) => void;
  updateCircuitConfig: (partial: Partial<ZoftCircuitConfig>) => void;
  applyPreset: (presetId: string) => void;
  triggerProofPulse: () => void;
  launchApiGateway: (input: {
    name: string;
    slug: string;
    upstreamUrl: string;
    method: 'GET' | 'POST';
    priceUsdg: number;
    priceAutonomo: number;
    network: string;
    payTo: string;
    description: string;
  }) => AutonomoProject;
  recordSimulatedCall: (event: Omit<RealtimeCallEvent, 'id' | 'timestamp'>) => void;
  addShieldedNote: (note: Omit<ShieldedNote, 'id' | 'commitmentShort' | 'isSample'>) => void;
}

const INITIAL_NOTES: ShieldedNote[] = [
  {
    id: 'note-01',
    label: 'Note #01 · Robinhood Gateway Vault',
    asset: 'USDG',
    amount: '1,250.00',
    chainName: 'Robinhood Chain',
    commitmentShort: '0x9f8a...31c4',
    isSample: true,
  },
  {
    id: 'note-02',
    label: 'Note #02 · x402 Revenue Pool',
    asset: 'USDC',
    amount: '2,750.00',
    chainName: 'Base',
    commitmentShort: '0x4b2e...88d1',
    isSample: true,
  },
  {
    id: 'note-03',
    label: 'Note #03 · Agent Treasury Reserve',
    asset: '$AUTONOMO',
    amount: '450,000.00',
    chainName: 'Robinhood Chain',
    commitmentShort: '0x7c19...e04a',
    isSample: true,
  },
  {
    id: 'note-04',
    label: 'Note #04 · Arbitrum Settlement Note',
    asset: 'USDC',
    amount: '500.00',
    chainName: 'Arbitrum',
    commitmentShort: '0x2d01...9a7f',
    isSample: true,
  },
];

const INITIAL_CALL_EVENTS: RealtimeCallEvent[] = [
  {
    id: 'evt-1',
    timestamp: 'Just now',
    endpointPath: '/x/token-price',
    projectName: 'Token Price',
    network: 'Robinhood Chain',
    amountPaid: '1,000',
    asset: '$AUTONOMO',
    agentId: 'codex-agent-0x8f2a',
    httpStatus: 200,
    latencyMs: 38,
    mode: 'Sample',
  },
  {
    id: 'evt-2',
    timestamp: '18s ago',
    endpointPath: '/x/new-launches',
    projectName: 'New Launches',
    network: 'Robinhood Chain',
    amountPaid: '0.01',
    asset: 'USDG',
    agentId: 'robinhood-bot-0x41c9',
    httpStatus: 200,
    latencyMs: 54,
    mode: 'Sample',
  },
  {
    id: 'evt-3',
    timestamp: '42s ago',
    endpointPath: '/v1/verdict',
    projectName: 'AX1 Console',
    network: 'Base',
    amountPaid: '0.02',
    asset: 'USDC',
    agentId: 'claude-mcp-0x99b1',
    httpStatus: 200,
    latencyMs: 112,
    mode: 'Sample',
  },
  {
    id: 'evt-4',
    timestamp: '1m ago',
    endpointPath: '/x/token-risk',
    projectName: 'Risk Checker',
    network: 'Robinhood Chain',
    amountPaid: '1,000',
    asset: '$AUTONOMO',
    agentId: 'telegram-agent-0x77e4',
    httpStatus: 200,
    latencyMs: 63,
    mode: 'Sample',
  },
];

const DEFAULT_CIRCUIT_CONFIG: ZoftCircuitConfig = {
  sourceChainId: 4663, // Robinhood Chain
  destinationChainId: 8453, // Base
  assetId: 'USDG',
  amountInput: '1000',
  withdrawalSplitPercent: 75,
  selectedNoteIds: ['note-01', 'note-02'],
  solverBatchSizePreview: 8,
  nativeGasDropInput: '0.005',
  lzReadDisplayStatus: 'illustrative',
  aspDisplayStatus: 'illustrative',
  recipientInput: 'st:eth:0x71C95911E9a5D330f4D621842EC243EE1343292e',
  selectedComposeRoute: 'direct',
  simulationMode: true,
};

const RealtimeStoreContext = createContext<RealtimeStoreContextValue | null>(null);

export const RealtimeStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<AutonomoProject[]>(() => {
    try {
      const saved = localStorage.getItem('autonomo_projects_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore storage errors
    }
    return INITIAL_PROJECTS;
  });

  const [callEvents, setCallEvents] = useState<RealtimeCallEvent[]>(INITIAL_CALL_EVENTS);
  const [notes, setNotes] = useState<ShieldedNote[]>(INITIAL_NOTES);
  const [circuitConfig, setCircuitConfig] = useState<ZoftCircuitConfig>(DEFAULT_CIRCUIT_CONFIG);
  const [balancesHidden, setBalancesHidden] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [walletConnected, setWalletConnected] = useState(true);
  const [walletAddress] = useState('0x8F2a...9C41 (Sample Agent Wallet)');
  const [activeNetwork, setActiveNetwork] = useState('Robinhood Chain (eip155:4663)');
  const [proofPulseCounter, setProofPulseCounter] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem('autonomo_projects_v1', JSON.stringify(projects));
    } catch {
      // ignore storage errors
    }
  }, [projects]);

  const updateCircuitConfig = useCallback((partial: Partial<ZoftCircuitConfig>) => {
    setCircuitConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  const triggerProofPulse = useCallback(() => {
    setProofPulseCounter((c) => c + 1);
  }, []);

  const applyPreset = useCallback((presetId: string) => {
    const preset = USE_CASE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setCircuitConfig((prev) => ({
      ...prev,
      withdrawalSplitPercent: preset.splitPercent,
      amountInput: preset.amountInput,
      selectedComposeRoute: preset.composeRoute,
      selectedNoteIds: INITIAL_NOTES.slice(0, preset.noteCount).map((n) => n.id),
      simulationMode: true,
    }));
    setProofPulseCounter((c) => c + 1);
  }, []);

  const launchApiGateway = useCallback(
    (input: {
      name: string;
      slug: string;
      upstreamUrl: string;
      method: 'GET' | 'POST';
      priceUsdg: number;
      priceAutonomo: number;
      network: string;
      payTo: string;
      description: string;
    }): AutonomoProject => {
      const { json } = buildX402HeaderPayload({
        slug: input.slug,
        priceUsdg: input.priceUsdg,
        priceAutonomo: input.priceAutonomo,
        network: 'eip155:4663',
        payTo: input.payTo,
        description: input.description,
      });

      const newProj: AutonomoProject = {
        id: `proj-custom-${Date.now()}`,
        slug: input.slug,
        name: input.name,
        category: 'service',
        featured: true,
        officialRobinhood: input.network.includes('Robinhood'),
        networks: [input.network],
        minPriceUsd: input.priceUsdg,
        priceLabel: `${input.priceAutonomo.toLocaleString('en-US')} $AUTONOMO · ${input.priceUsdg} USDG`,
        endpointsCount: 1,
        calls30d: 1,
        createdAtOrder: Date.now(),
        host: `autonomo.fun/x/${input.slug}`,
        facilitator: 'Autonomo Robinhood Facilitator',
        payTo: input.payTo || AUTONOMO_CONTRACT_ADDRESS,
        description: input.description,
        endpoints: [
          {
            method: input.method,
            path: `/x/${input.slug}`,
            priceDisplay: `${input.priceAutonomo.toLocaleString('en-US')} $AUTONOMO / ${input.priceUsdg} USDG`,
            priceUsdg: input.priceUsdg,
            priceAutonomo: input.priceAutonomo,
            network: `${input.network} (eip155:4663)`,
            scheme: 'permit2',
            description: input.description,
            sampleResponse: {
              gateway: `https://autonomo.fun/x/${input.slug}`,
              upstream: input.upstreamUrl,
              x402Accepts: json.accepts,
              status: '200 OK · Forwarded via Autonomo Hosted Gateway',
            },
          },
        ],
      };

      setProjects((prev) => [newProj, ...prev]);
      setCallEvents((prev) => [
        {
          id: `evt-${Date.now()}`,
          timestamp: 'Just now',
          endpointPath: `/x/${input.slug}`,
          projectName: input.name,
          network: input.network,
          amountPaid: input.priceAutonomo.toLocaleString('en-US'),
          asset: '$AUTONOMO',
          agentId: 'gateway-launch-check',
          httpStatus: 200,
          latencyMs: 29,
          mode: 'Simulation',
        },
        ...prev,
      ]);
      setProofPulseCounter((c) => c + 1);
      return newProj;
    },
    []
  );

  const recordSimulatedCall = useCallback(
    (event: Omit<RealtimeCallEvent, 'id' | 'timestamp'>) => {
      const newEvt: RealtimeCallEvent = {
        ...event,
        id: `evt-${Date.now()}`,
        timestamp: 'Just now',
      };
      setCallEvents((prev) => [newEvt, ...prev.slice(0, 24)]);
      setProjects((prev) =>
        prev.map((p) =>
          p.name === event.projectName ? { ...p, calls30d: p.calls30d + 1 } : p
        )
      );
      setProofPulseCounter((c) => c + 1);
    },
    []
  );

  const addShieldedNote = useCallback(
    (note: Omit<ShieldedNote, 'id' | 'commitmentShort' | 'isSample'>) => {
      const hex = Math.floor(Math.random() * 0xffff)
        .toString(16)
        .padStart(4, '0');
      const newNote: ShieldedNote = {
        ...note,
        id: `note-${Date.now()}`,
        commitmentShort: `0x8a${hex}...f19c`,
        isSample: true,
      };
      setNotes((prev) => [newNote, ...prev]);
      setCircuitConfig((prev) => ({
        ...prev,
        selectedNoteIds: [newNote.id, ...prev.selectedNoteIds.slice(0, 3)],
      }));
      setProofPulseCounter((c) => c + 1);
    },
    []
  );

  const toggleWallet = useCallback(() => {
    setWalletConnected((v) => !v);
  }, []);

  return (
    <RealtimeStoreContext.Provider
      value={{
        projects,
        callEvents,
        notes,
        circuitConfig,
        balancesHidden,
        reducedMotion,
        walletConnected,
        walletAddress,
        activeNetwork,
        proofPulseCounter,
        setBalancesHidden,
        setReducedMotion,
        toggleWallet,
        setActiveNetwork,
        updateCircuitConfig,
        applyPreset,
        triggerProofPulse,
        launchApiGateway,
        recordSimulatedCall,
        addShieldedNote,
      }}
    >
      {children}
    </RealtimeStoreContext.Provider>
  );
};

export function useRealtimeStore(): RealtimeStoreContextValue {
  const ctx = useContext(RealtimeStoreContext);
  if (!ctx) {
    throw new Error('useRealtimeStore must be used inside RealtimeStoreProvider');
  }
  return ctx;
}
