import { FilterableProject } from './math';

export const AUTONOMO_CONTRACT_ADDRESS = '0xe83c85e1ead16fcfe85401e2b337fb4fb5b5cc96';
export const PERMIT2_CONTRACT_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3';

export type VisualizationStatus = 'illustrative' | 'pending' | 'verified' | 'unavailable' | 'error';

export interface ZoftCircuitConfig {
  sourceChainId: number | null;
  destinationChainId: number | null;
  assetId: string | null;
  amountInput: string;
  withdrawalSplitPercent: number;
  selectedNoteIds: string[];
  solverBatchSizePreview: number;
  nativeGasDropInput: string;
  lzReadDisplayStatus: VisualizationStatus;
  aspDisplayStatus: VisualizationStatus;
  recipientInput: string;
  selectedComposeRoute: 'direct' | 'aave-v3' | 'uniswap-v4' | 'pendle-pt';
  simulationMode: boolean;
}

export interface AutonomoEndpoint {
  method: 'GET' | 'POST';
  path: string;
  priceDisplay: string;
  priceUsdg: number;
  priceAutonomo?: number;
  network: string;
  scheme: 'exact' | 'permit2';
  description: string;
  sampleResponse: Record<string, unknown>;
}

export interface AutonomoProject extends FilterableProject {
  slug: string;
  featured?: boolean;
  officialRobinhood?: boolean;
  priceLabel: string;
  endpointsCount: number;
  facilitator: string;
  payTo: string;
  endpoints: AutonomoEndpoint[];
}

export const INITIAL_PROJECTS: AutonomoProject[] = [
  {
    id: 'proj-token-price',
    slug: 'token-price',
    name: 'Token Price',
    category: 'service',
    featured: true,
    officialRobinhood: true,
    networks: ['Robinhood Chain'],
    minPriceUsd: 0.01,
    priceLabel: '1,000 $AUTONOMO · 0.01 USDG',
    endpointsCount: 1,
    calls30d: 68420,
    createdAtOrder: 100,
    host: 'autonomo.fun/x/token-price',
    facilitator: 'Autonomo Robinhood Facilitator',
    payTo: '0xe83c85e1ead16fcfe85401e2b337fb4fb5b5cc96',
    description:
      'Live $AUTONOMO token price, market cap, 24h volume and Robinhood Chain liquidity depth. Payable per call in USDG (EIP-3009) or $AUTONOMO (Permit2).',
    endpoints: [
      {
        method: 'GET',
        path: '/x/token-price',
        priceDisplay: '1,000 $AUTONOMO / 0.01 USDG',
        priceUsdg: 0.01,
        priceAutonomo: 1000,
        network: 'eip155:4663 (Robinhood Chain)',
        scheme: 'permit2',
        description: 'Returns live $AUTONOMO spot price, 24h delta, FDV, and pool depth.',
        sampleResponse: {
          token: '$AUTONOMO',
          contract: AUTONOMO_CONTRACT_ADDRESS,
          network: 'Robinhood Chain (eip155:4663)',
          priceUsd: 0.0000142,
          change24hPercent: '+18.4%',
          liquidityUsd: 412800,
          volume24hUsd: 189400,
          settledVia: 'x402 Permit2 Facilitator',
        },
      },
    ],
  },
  {
    id: 'proj-new-launches',
    slug: 'new-launches',
    name: 'New Launches',
    category: 'service',
    featured: true,
    officialRobinhood: true,
    networks: ['Robinhood Chain'],
    minPriceUsd: 0.01,
    priceLabel: '1,000 $AUTONOMO · 0.01 USDG',
    endpointsCount: 1,
    calls30d: 54910,
    createdAtOrder: 99,
    host: 'autonomo.fun/x/new-launches',
    facilitator: 'Autonomo Robinhood Facilitator',
    payTo: '0xe83c85e1ead16fcfe85401e2b337fb4fb5b5cc96',
    description:
      'Newest token launches on Robinhood Chain: name, age, buys, sells, market cap and bonding curve progress for each new token.',
    endpoints: [
      {
        method: 'GET',
        path: '/x/new-launches',
        priceDisplay: '1,000 $AUTONOMO / 0.01 USDG',
        priceUsdg: 0.01,
        priceAutonomo: 1000,
        network: 'eip155:4663 (Robinhood Chain)',
        scheme: 'permit2',
        description: 'Lists recent Robinhood Chain launchpad tokens with bonding curve telemetry.',
        sampleResponse: {
          network: 'Robinhood Chain (eip155:4663)',
          updatedAt: 'Live block #4,819,204',
          launches: [
            {
              symbol: '$ZOFT',
              name: 'zOFT Noir Reactor',
              age: '14m',
              buys: 142,
              sells: 19,
              marketCapUsd: '$84,200',
              bondingCurveProgress: '91.4%',
            },
            {
              symbol: '$HOODAI',
              name: 'Robinhood Agent Swarm',
              age: '38m',
              buys: 298,
              sells: 64,
              marketCapUsd: '$129,500',
              bondingCurveProgress: '100% (Graduated)',
            },
            {
              symbol: '$X402PAY',
              name: 'Bazaar Micro Router',
              age: '1h 12m',
              buys: 89,
              sells: 12,
              marketCapUsd: '$41,900',
              bondingCurveProgress: '64.2%',
            },
          ],
        },
      },
    ],
  },
  {
    id: 'proj-risk-checker',
    slug: 'risk-checker',
    name: 'Risk Checker',
    category: 'service',
    featured: true,
    officialRobinhood: true,
    networks: ['Robinhood Chain'],
    minPriceUsd: 0.01,
    priceLabel: '1,000 $AUTONOMO · 0.01 USDG',
    endpointsCount: 1,
    calls30d: 49300,
    createdAtOrder: 98,
    host: 'autonomo.fun/x/token-risk',
    facilitator: 'Autonomo Robinhood Facilitator',
    payTo: '0xe83c85e1ead16fcfe85401e2b337fb4fb5b5cc96',
    description:
      'Rug-risk check for Robinhood Chain launchpad tokens: holder concentration, creator holdings, launch-block buyers and bot volume, scored low/medium/high.',
    endpoints: [
      {
        method: 'GET',
        path: '/x/token-risk',
        priceDisplay: '1,000 $AUTONOMO / 0.01 USDG',
        priceUsdg: 0.01,
        priceAutonomo: 1000,
        network: 'eip155:4663 (Robinhood Chain)',
        scheme: 'permit2',
        description: 'Audits holder distribution, sniper bundles, and creator wallet retention.',
        sampleResponse: {
          targetToken: '$AUTONOMO',
          contract: AUTONOMO_CONTRACT_ADDRESS,
          overallRiskScore: 'LOW (12/100)',
          top10HoldersPercent: '14.8%',
          creatorHoldingsPercent: '1.2%',
          launchBlockSniperPercent: '0.0%',
          estimatedBotVolumePercent: '4.1%',
          aspAssociationStatus: 'Sample · Standard Liquidity Pool Verified',
        },
      },
    ],
  },
  {
    id: 'proj-ax1-console',
    slug: 'ax1-console',
    name: 'AX1 Console',
    category: 'service',
    featured: true,
    networks: ['Base'],
    minPriceUsd: 0.02,
    priceLabel: 'from $0.02',
    endpointsCount: 1,
    calls30d: 155400,
    createdAtOrder: 95,
    host: 'www.ax1.vc',
    facilitator: 'Coinbase CDP Facilitator',
    payTo: '0x71C95911E9a5D330f4D621842EC243EE1343292e',
    description:
      'Send a Base token contract address, get an AI-written verdict: onchain metrics, a plain-language take, and a shareable verdict card. Entertainment, not trading advice.',
    endpoints: [
      {
        method: 'POST',
        path: '/v1/verdict',
        priceDisplay: '$0.02 USDC',
        priceUsdg: 0.02,
        network: 'eip155:8453 (Base)',
        scheme: 'exact',
        description: 'Generates onchain liquidity, holder velocity, and plain-language summary.',
        sampleResponse: {
          verdict: 'Accumulation Phase · High Organic Retention',
          onchainScore: 84,
          activeAddresses24h: 1940,
          summary: 'Liquidity locked with steady agentic micro-call volume across Base.',
        },
      },
    ],
  },
  {
    id: 'proj-research-note',
    slug: 'research-note-section-template',
    name: 'Research note - Section template',
    category: 'service',
    networks: ['Base'],
    minPriceUsd: 0.01,
    priceLabel: 'from $0.01',
    endpointsCount: 59211,
    calls30d: 103000,
    createdAtOrder: 90,
    host: 'market.datapackvibe.com',
    facilitator: 'Coinbase CDP Facilitator',
    payTo: '0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE',
    description:
      'Publication proofing — IQR outlier flags + Explicit missing-value fill for supplied publication proofing records (checked_pages, flagged_pages). Up to 200 rows; 0.01 USDC includes 2 supplied-data reports.',
    endpoints: [
      {
        method: 'POST',
        path: '/v2/proofing/iqr-fill',
        priceDisplay: '$0.01 USDC',
        priceUsdg: 0.01,
        network: 'eip155:8453 (Base)',
        scheme: 'exact',
        description: 'Runs IQR outlier detection and deterministic imputation on supplied rows.',
        sampleResponse: {
          checkedPages: 180,
          flaggedOutliers: 3,
          imputedCells: 7,
          status: 'COMPLETED',
        },
      },
    ],
  },
  {
    id: 'proj-blockrun-ai',
    slug: 'blockrun-ai',
    name: 'BlockRun.AI',
    category: 'service',
    featured: true,
    networks: ['Base'],
    minPriceUsd: 0.002,
    priceLabel: 'from $0.002',
    endpointsCount: 111,
    calls30d: 96000,
    createdAtOrder: 89,
    host: 'blockrun.ai',
    facilitator: 'PayAI Facilitator',
    payTo: '0x881D40237659C251811CEC9c364ef91dC08D300C',
    description:
      'Neural and keyword web search. Optional category filter: company, research paper, news, pdf, github, tweet, personal site, linkedin profile, financial report.',
    endpoints: [
      {
        method: 'GET',
        path: '/v1/search?q=x402+protocol&category=research_paper',
        priceDisplay: '$0.002 USDC',
        priceUsdg: 0.002,
        network: 'eip155:8453 (Base)',
        scheme: 'exact',
        description: 'Executes low-latency neural index search for autonomous agents.',
        sampleResponse: {
          query: 'x402 protocol',
          resultsCount: 3,
          topHit: 'HTTP 402 Payment Required: Native Stablecoin Settlement for AI Agents',
          latencyMs: 42,
        },
      },
    ],
  },
  {
    id: 'proj-pocket-network',
    slug: 'pocket-network',
    name: 'Pocket Network',
    category: 'service',
    networks: ['Base'],
    minPriceUsd: 0.005,
    priceLabel: 'from $0.005',
    endpointsCount: 116,
    calls30d: 74700,
    createdAtOrder: 88,
    host: 'agent.pocket.network',
    facilitator: 'Coinbase CDP Facilitator',
    payTo: '0x999999cf1046e68e36E1aA2E0E07105eDDD1f08E',
    description:
      'An agent-only messaging network. Agents register with an Ed25519 key and talk in public rooms and end-to-end encrypted private rooms and DMs. Pay per request in USDC; no account, no API key.',
    endpoints: [
      {
        method: 'POST',
        path: '/v2/rooms',
        priceDisplay: '$0.005 USDC',
        priceUsdg: 0.005,
        network: 'eip155:8453 (Base)',
        scheme: 'exact',
        description: 'Searches public agent rooms by topic and dispatches signed Ed25519 events.',
        sampleResponse: {
          room: 'x402-solvers-coordination',
          activeAgents: 64,
          encryption: 'Ed25519 / X25519',
        },
      },
    ],
  },
  {
    id: 'proj-x-pay',
    slug: 'x-pay',
    name: 'X Pay',
    category: 'service',
    networks: ['Base'],
    minPriceUsd: 0.005,
    priceLabel: 'from $0.005',
    endpointsCount: 14,
    calls30d: 65000,
    createdAtOrder: 86,
    host: 'www.api-xpay.com',
    facilitator: 'Coinbase CDP Facilitator',
    payTo: '0x444444cf1046e68e36E1aA2E0E07105eDDD1f08E',
    description: 'Payment quote with amount, asset, and merchant wallet for x402 agent checkouts.',
    endpoints: [
      {
        method: 'GET',
        path: '/v1/quote',
        priceDisplay: '$0.005 USDC',
        priceUsdg: 0.005,
        network: 'eip155:8453 (Base)',
        scheme: 'exact',
        description: 'Returns deterministic merchant payment quote with EIP-3009 authorization.',
        sampleResponse: {
          quoteId: 'qt_99281a',
          asset: 'USDC',
          amount: '0.005',
          expirySeconds: 60,
        },
      },
    ],
  },
  {
    id: 'proj-stableenrich',
    slug: 'stableenrich',
    name: 'StableEnrich',
    category: 'service',
    networks: ['Base', 'Solana'],
    minPriceUsd: 0.002,
    priceLabel: 'from $0.002',
    endpointsCount: 24,
    calls30d: 42400,
    createdAtOrder: 85,
    host: 'stableenrich.dev',
    facilitator: 'PayAI Facilitator',
    payTo: '0x555555cf1046e68e36E1aA2E0E07105eDDD1f08E',
    description:
      'PDL Person Enrich — career history, emails, phone. No match: HTTP 200, status 404, data null — not billed. Match: $0.28.',
    endpoints: [
      {
        method: 'POST',
        path: '/v1/enrich/profile',
        priceDisplay: '$0.002 USDC',
        priceUsdg: 0.002,
        network: 'eip155:8453 (Base)',
        scheme: 'exact',
        description: 'Queries structured B2B entity enrichment with zero charge on 404 miss.',
        sampleResponse: {
          matched: true,
          organization: 'Autonomo Labs',
          role: 'Protocol Engineer',
        },
      },
    ],
  },
  {
    id: 'proj-sniperx',
    slug: 'x402-sniperx-fun',
    name: 'x402.sniperx.fun',
    category: 'service',
    networks: ['Solana'],
    minPriceUsd: 0.004,
    priceLabel: 'from $0.004',
    endpointsCount: 10,
    calls30d: 34700,
    createdAtOrder: 83,
    host: 'x402.sniperx.fun',
    facilitator: 'Dexter',
    payTo: 'So11111111111111111111111111111111111111112',
    description: 'Get SmartMoney trading activities on token (sorted by time descending) on Solana.',
    endpoints: [
      {
        method: 'GET',
        path: '/v1/smart-money/feed',
        priceDisplay: '$0.004 USDC',
        priceUsdg: 0.004,
        network: 'solana:mainnet',
        scheme: 'exact',
        description: 'Streams recent high-conviction wallet swaps on Solana DEX pools.',
        sampleResponse: {
          walletsTracked: 42,
          netInflowUsd1h: '+$148,900',
        },
      },
    ],
  },
  {
    id: 'proj-keyring-agent',
    slug: 'keyring-agent-blockchhub-link',
    name: 'keyring-agent.blockchhub.link',
    category: 'service',
    networks: ['Base'],
    minPriceUsd: 0.05,
    priceLabel: 'from $0.05',
    endpointsCount: 3,
    calls30d: 29400,
    createdAtOrder: 81,
    host: 'keyring-agent.blockchhub.link',
    facilitator: 'Coinbase CDP Facilitator',
    payTo: '0x666666cf1046e68e36E1aA2E0E07105eDDD1f08E',
    description: 'Pay the send-native execution fee (native coin transfer) for delegated agent wallets.',
    endpoints: [
      {
        method: 'POST',
        path: '/v1/execute-native',
        priceDisplay: '$0.05 USDC',
        priceUsdg: 0.05,
        network: 'eip155:8453 (Base)',
        scheme: 'exact',
        description: 'Relays gas-sponsored native execution for ephemeral agent signers.',
        sampleResponse: {
          relayStatus: 'QUEUED',
          sponsoredGasWei: '21000',
        },
      },
    ],
  },
  {
    id: 'proj-chainlink-agents',
    slug: 'agents-chain-link',
    name: 'agents.chain.link',
    category: 'service',
    networks: ['Base'],
    minPriceUsd: 0.002,
    priceLabel: 'from $0.002',
    endpointsCount: 2,
    calls30d: 14300,
    createdAtOrder: 80,
    host: 'agents.chain.link',
    facilitator: 'Coinbase CDP Facilitator',
    payTo: '0x777777cf1046e68e36E1aA2E0E07105eDDD1f08E',
    description: 'Chainlink For Agents: execute a catalog workflow by workflow name.',
    endpoints: [
      {
        method: 'POST',
        path: '/v1/workflows/execute',
        priceDisplay: '$0.002 USDC',
        priceUsdg: 0.002,
        network: 'eip155:8453 (Base)',
        scheme: 'exact',
        description: 'Triggers verifiable DON workflow execution with x402 payment receipt.',
        sampleResponse: {
          workflow: 'cross-chain-oracle-attestation',
          donVerified: true,
        },
      },
    ],
  },
  // Facilitators
  {
    id: 'fac-cdp',
    slug: 'cdp-facilitator',
    name: 'Coinbase CDP Facilitator',
    category: 'facilitator',
    featured: true,
    networks: ['Base', 'Solana'],
    minPriceUsd: 0,
    priceLabel: '0% protocol fee',
    endpointsCount: 4,
    calls30d: 512000,
    createdAtOrder: 97,
    host: 'api.cdp.coinbase.com/x402',
    facilitator: 'Coinbase CDP',
    payTo: '0x0000000000000000000000000000000000000000',
    description:
      'Coinbase-hosted facilitator that verifies and settles x402 payments, with KYT and OFAC screening on each transaction. Also runs the CDP Bazaar discovery catalog.',
    endpoints: [
      {
        method: 'POST',
        path: '/verify-and-settle',
        priceDisplay: 'Free public settlement',
        priceUsdg: 0,
        network: 'eip155:8453 (Base)',
        scheme: 'exact',
        description: 'Verifies EIP-3009 authorization and settles USDC on Base & Solana.',
        sampleResponse: {
          facilitator: 'Coinbase CDP',
          kytScreening: 'PASSED',
          bazaarIndexed: true,
        },
      },
    ],
  },
  {
    id: 'fac-autonomo-robinhood',
    slug: 'autonomo-robinhood-facilitator',
    name: 'Autonomo Robinhood Facilitator',
    category: 'facilitator',
    featured: true,
    officialRobinhood: true,
    networks: ['Robinhood Chain'],
    minPriceUsd: 0,
    priceLabel: 'USDG & $AUTONOMO native',
    endpointsCount: 3,
    calls30d: 172630,
    createdAtOrder: 96,
    host: 'autonomo.fun/facilitator',
    facilitator: 'Autonomo Core',
    payTo: AUTONOMO_CONTRACT_ADDRESS,
    description:
      'Native Robinhood Chain (eip155:4663) facilitator settling USDG via EIP-3009 single-signature and $AUTONOMO via Permit2 with zero agent gas.',
    endpoints: [
      {
        method: 'POST',
        path: '/v1/settle-robinhood',
        priceDisplay: 'Gasless EIP-3009 / Permit2',
        priceUsdg: 0,
        network: 'eip155:4663 (Robinhood Chain)',
        scheme: 'permit2',
        description: 'Verifies Permit2 and EIP-3009 signatures and settles on Robinhood Chain.',
        sampleResponse: {
          facilitator: 'Autonomo Robinhood Chain Facilitator',
          supportedAssets: ['USDG', '$AUTONOMO'],
          permit2Contract: PERMIT2_CONTRACT_ADDRESS,
        },
      },
    ],
  },
  {
    id: 'fac-payai',
    slug: 'payai-facilitator',
    name: 'PayAI Facilitator',
    category: 'facilitator',
    featured: true,
    networks: ['Base', 'Solana', 'Polygon', 'Arbitrum'],
    minPriceUsd: 0,
    priceLabel: 'Multi-chain public catalog',
    endpointsCount: 5,
    calls30d: 284000,
    createdAtOrder: 94,
    host: 'facilitator.payai.network',
    facilitator: 'PayAI',
    payTo: '0x0000000000000000000000000000000000000000',
    description:
      'Production facilitator that works across many networks and tokens without API keys. Exposes a public discovery endpoint listing the resources it settles for.',
    endpoints: [
      {
        method: 'GET',
        path: '/bazaar/catalog',
        priceDisplay: 'Open Discovery',
        priceUsdg: 0,
        network: 'Multi-chain',
        scheme: 'exact',
        description: 'Lists active x402 resources settled by PayAI.',
        sampleResponse: { indexedResources: 1420, status: 'ONLINE' },
      },
    ],
  },
  {
    id: 'fac-celo',
    slug: 'celo-facilitator',
    name: 'Celo Facilitator',
    category: 'facilitator',
    networks: ['Celo'],
    minPriceUsd: 0,
    priceLabel: 'EIP-3009 + Permit2',
    endpointsCount: 2,
    calls30d: 19200,
    createdAtOrder: 76,
    host: 'x402.celo.org',
    facilitator: 'Celo Foundation',
    payTo: '0x0000000000000000000000000000000000000000',
    description:
      'Gasless facilitator for Celo mainnet and Celo Sepolia. Accepts USDC, USD₮ and USA₮ via EIP-3009, and regional stablecoins (wARS, wBRL, wCOP) via Permit2.',
    endpoints: [],
  },
  {
    id: 'fac-dexter',
    slug: 'dexter',
    name: 'Dexter',
    category: 'facilitator',
    networks: ['Solana', 'Base'],
    minPriceUsd: 0,
    priceLabel: 'Free · No account',
    endpointsCount: 2,
    calls30d: 41800,
    createdAtOrder: 75,
    host: 'dexter.x402.org',
    facilitator: 'Dexter',
    payTo: '0x0000000000000000000000000000000000000000',
    description: 'Free public facilitator for Solana and EVM chains. No fees and no account needed.',
    endpoints: [],
  },
  // SDKs
  {
    id: 'sdk-reference',
    slug: 'x402-reference-sdks',
    name: 'x402 reference SDKs',
    category: 'sdk',
    featured: true,
    networks: ['Base', 'Robinhood Chain', 'Solana', 'Polygon', 'Arbitrum'],
    minPriceUsd: 0,
    priceLabel: 'Open Source MIT',
    endpointsCount: 8,
    calls30d: 310000,
    createdAtOrder: 93,
    host: 'github.com/coinbase/x402',
    facilitator: 'Any x402 Facilitator',
    payTo: '0x0000000000000000000000000000000000000000',
    description:
      'The reference implementation of the protocol: TypeScript packages (@x402/core, fetch/axios clients, Express/Hono/Fastify/Next servers, MCP, paywall), plus Python, Go and Java.',
    endpoints: [],
  },
  {
    id: 'sdk-x402-rs',
    slug: 'x402-rs',
    name: 'x402-rs',
    category: 'sdk',
    networks: ['Base', 'Solana', 'Robinhood Chain'],
    minPriceUsd: 0,
    priceLabel: 'Rust Crate',
    endpointsCount: 3,
    calls30d: 44000,
    createdAtOrder: 74,
    host: 'crates.io/crates/x402-rs',
    facilitator: 'Any x402 Facilitator',
    payTo: '0x0000000000000000000000000000000000000000',
    description: 'Community Rust toolkit for x402, including client, server and facilitator pieces.',
    endpoints: [],
  },
  {
    id: 'sdk-x402-rails',
    slug: 'x402-rails',
    name: 'x402-rails',
    category: 'sdk',
    networks: ['Base', 'Robinhood Chain'],
    minPriceUsd: 0,
    priceLabel: 'Ruby Gem',
    endpointsCount: 2,
    calls30d: 18500,
    createdAtOrder: 72,
    host: 'rubygems.org/gems/x402-rails',
    facilitator: 'Quicknode',
    payTo: '0x0000000000000000000000000000000000000000',
    description: 'Ruby on Rails library for charging for routes with x402, maintained by Quicknode.',
    endpoints: [],
  },
  // Extensions & Explorers
  {
    id: 'ext-zoft-stealth',
    slug: 'zoft-stealth-join-split',
    name: 'zOFT Noir Join-Split & Stealth Extension',
    category: 'extension',
    featured: true,
    officialRobinhood: true,
    networks: ['Robinhood Chain', 'Base', 'Arbitrum'],
    minPriceUsd: 0,
    priceLabel: 'Privacy Extension · Simulation',
    endpointsCount: 4,
    calls30d: 39400,
    createdAtOrder: 92,
    host: 'zoft.finance/x402-extension',
    facilitator: 'LayerZero V2 lzRead / ZK-DVN',
    payTo: AUTONOMO_CONTRACT_ADDRESS,
    description:
      'Proposed UTXO join-split privacy extension for x402 API revenue and agent treasuries: partition intent output vs shielded change with ERC-5564 stealth settlement and viewing keys.',
    endpoints: [],
  },
  {
    id: 'exp-autonomo-bazaar',
    slug: 'autonomo-bazaar-indexer',
    name: 'Autonomo Bazaar & Robinhood Explorer',
    category: 'explorer',
    featured: true,
    officialRobinhood: true,
    networks: ['Robinhood Chain', 'Base', 'Solana'],
    minPriceUsd: 0,
    priceLabel: 'Free Discovery API',
    endpointsCount: 4,
    calls30d: 128900,
    createdAtOrder: 91,
    host: 'autonomo.fun/api/v1',
    facilitator: 'Autonomo Core',
    payTo: AUTONOMO_CONTRACT_ADDRESS,
    description:
      'Real-time directory and endpoint-level search across 3,711+ paid services, 16 facilitators, and Robinhood Chain hosted gateways.',
    endpoints: [],
  },
];

export const NETWORK_COUNTS = [
  { name: 'Base', slug: 'Base', count: 3508 },
  { name: 'Solana', slug: 'Solana', count: 255 },
  { name: 'Base Sepolia', slug: 'Base Sepolia', count: 37 },
  { name: 'Polygon', slug: 'Polygon', count: 8 },
  { name: 'Robinhood Chain', slug: 'Robinhood Chain', count: 6, highlight: true },
  { name: 'Arbitrum', slug: 'Arbitrum', count: 3 },
  { name: 'Celo', slug: 'Celo', count: 2 },
];

export interface UseCasePreset {
  id: string;
  title: string;
  problem: string;
  proposedFlow: string;
  splitPercent: number;
  amountInput: string;
  composeRoute: ZoftCircuitConfig['selectedComposeRoute'];
  noteCount: number;
}

export const USE_CASE_PRESETS: UseCasePreset[] = [
  {
    id: 'payroll',
    title: 'Confidential Payroll & Agent Budgets',
    problem:
      'Funding autonomous worker agents or contributors from a single treasury wallet exposes total vault balances and sibling payouts.',
    proposedFlow:
      'Partition a shielded note into a 75% cross-chain payout to a stealth ERC-5564 destination while retaining 25% as a new shielded change commitment.',
    splitPercent: 75,
    amountInput: '1000',
    composeRoute: 'direct',
    noteCount: 2,
  },
  {
    id: 'treasury',
    title: 'API Gateway Revenue Rebalancing',
    problem:
      'High-frequency x402 API merchants accumulating USDG & $AUTONOMO on Robinhood Chain reveal real-time revenue velocity to competitors.',
    proposedFlow:
      'Consolidate 3 UTXO notes at a 65% settlement ratio via LayerZero V2 lzRead state verification into Aave V3 yield while keeping 35% liquid.',
    splitPercent: 65,
    amountInput: '4500',
    composeRoute: 'aave-v3',
    noteCount: 3,
  },
  {
    id: 'b2b',
    title: 'B2B Agentic Invoicing',
    problem:
      'Enterprise AI agents paying high-value x402 data providers require selective auditability for accounting without public wallet linkage.',
    proposedFlow:
      'Execute an 80% intent settlement with scoped viewing-key disclosure for authorized auditors and 20% shielded change.',
    splitPercent: 80,
    amountInput: '2500',
    composeRoute: 'uniswap-v4',
    noteCount: 2,
  },
  {
    id: 'portfolio',
    title: 'Solver & Liquidity Separation',
    problem:
      'Market-making agents routing across Base and Robinhood Chain leak inventory skew when settling directly from primary vaults.',
    proposedFlow:
      'Balanced 50% / 50% join-split across 4 commitment notes with Pendle PT compose routing in simulation mode.',
    splitPercent: 50,
    amountInput: '10000',
    composeRoute: 'pendle-pt',
    noteCount: 4,
  },
];

export interface CircuitNodeSpec {
  id: 'vault' | 'notes' | 'reactor' | 'lzread' | 'destination';
  stepNumber: string;
  title: string;
  subtitle: string;
  statusLabel: string;
  description: string;
}

export const CIRCUIT_LAB_NODES: CircuitNodeSpec[] = [
  {
    id: 'vault',
    stepNumber: '01',
    title: 'Source Vault & ASP Set',
    subtitle: 'Robinhood Chain / Base Commitment Tree',
    statusLabel: 'Illustrative · Sample Set',
    description:
      'Holds shielded USDG, USDC, and $AUTONOMO commitments. 0xbow Association Set Provider (ASP) membership is modeled as an illustrative check.',
  },
  {
    id: 'notes',
    stepNumber: '02',
    title: 'Input UTXO Notes',
    subtitle: 'Note Consolidation & Nullifier Derivation',
    statusLabel: 'Configurable (1–4 Notes)',
    description:
      'Selects private UTXO notes to spend in the client-side circuit, computing unique nullifier hashes to prevent double-spending.',
  },
  {
    id: 'reactor',
    stepNumber: '03',
    title: 'Noir Join-Split Reactor',
    subtitle: 'Client-Side ZK Proof & Partitioning',
    statusLabel: 'Interactive 3D Core',
    description:
      'Partitions input note value into exact Intent Output (W%) and Shielded Change (100-W%) before fees, updating the 3D reactor geometry live.',
  },
  {
    id: 'lzread',
    stepNumber: '04',
    title: 'LayerZero V2 lzRead & x402 Facilitator',
    subtitle: 'Cross-Chain State Read & EIP-3009 Verification',
    statusLabel: 'Simulation · Proposed Route',
    description:
      'Retrieves source Merkle root state via LayerZero V2 lzRead / ZK-DVN and settles x402 payment payloads on Robinhood Chain.',
  },
  {
    id: 'destination',
    stepNumber: '05',
    title: 'Stealth Destination & lzCompose',
    subtitle: 'ERC-5564 Receipt + Optional Gas Drop',
    statusLabel: 'Sample Output Preview',
    description:
      'Delivers settled funds to a one-time ERC-5564 stealth address or executes an optional lzCompose target route.',
  },
];
