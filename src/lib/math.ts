/**
 * Pure deterministic math, x402 protocol header encoding/decoding,
 * join-split base-unit calculations, and catalog filtering logic.
 */

export interface SplitCalculationResult {
  totalFormatted: string;
  intentFormatted: string;
  changeFormatted: string;
  intentRatio: number;
  changeRatio: number;
  isValid: boolean;
}

/**
 * Exact integer base-unit arithmetic (6 decimals, e.g. USDC / USDG)
 * Avoids IEEE-754 floating point drift (e.g. 1000 * 75% = 750.00 and 250.00).
 */
export function calculateJoinSplit(
  amountInput: string,
  withdrawalSplitPercent: number
): SplitCalculationResult {
  const clampedPercent = Math.max(0, Math.min(100, Math.round(withdrawalSplitPercent)));
  const cleaned = amountInput.trim().replace(/,/g, '');
  if (!cleaned || !/^\d+(\.\d{1,6})?$/.test(cleaned)) {
    return {
      totalFormatted: '0.00',
      intentFormatted: '0.00',
      changeFormatted: '0.00',
      intentRatio: clampedPercent,
      changeRatio: 100 - clampedPercent,
      isValid: false,
    };
  }

  const [wholePart, fracPart = ''] = cleaned.split('.');
  const paddedFrac = (fracPart + '000000').slice(0, 6);
  const totalMicro = BigInt(wholePart) * 1000000n + BigInt(paddedFrac);

  if (totalMicro <= 0n) {
    return {
      totalFormatted: '0.00',
      intentFormatted: '0.00',
      changeFormatted: '0.00',
      intentRatio: clampedPercent,
      changeRatio: 100 - clampedPercent,
      isValid: false,
    };
  }

  const intentMicro = (totalMicro * BigInt(clampedPercent)) / 100n;
  const changeMicro = totalMicro - intentMicro;

  return {
    totalFormatted: formatMicroUnits(totalMicro),
    intentFormatted: formatMicroUnits(intentMicro),
    changeFormatted: formatMicroUnits(changeMicro),
    intentRatio: clampedPercent,
    changeRatio: 100 - clampedPercent,
    isValid: true,
  };
}

export function formatMicroUnits(micro: bigint): string {
  const whole = micro / 1000000n;
  const frac = micro % 1000000n;
  const fracStr = frac.toString().padStart(6, '0').replace(/0+$/, '');
  const formattedWhole = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (fracStr.length === 0) {
    return `${formattedWhole}.00`;
  }
  if (fracStr.length === 1) {
    return `${formattedWhole}.${fracStr}0`;
  }
  return `${formattedWhole}.${fracStr}`;
}

/**
 * 16-unit Isometric Brick Strip math.
 * Preserves exact 1% state values while mapping cleanly to 16 visual bricks.
 */
export function getBrickFillCount(withdrawalSplitPercent: number): number {
  const clamped = Math.max(0, Math.min(100, withdrawalSplitPercent));
  if (clamped === 0) return 0;
  if (clamped === 100) return 16;
  return Math.round((clamped / 100) * 16);
}

export function brickIndexToPercent(brickIndexOneBased: number): number {
  const clampedIndex = Math.max(1, Math.min(16, Math.round(brickIndexOneBased)));
  return Math.round((clampedIndex / 16) * 100);
}

export interface X402PaymentRequiredPayload {
  x402Version: number;
  accepts: Array<{
    scheme: 'exact' | 'permit2';
    network: string;
    maxAmountRequired: string;
    resource: string;
    description: string;
    mimeType: string;
    payTo: string;
    asset: string;
  }>;
}

export function buildX402HeaderPayload(params: {
  slug: string;
  priceUsdg: number;
  priceAutonomo: number;
  network: string;
  payTo: string;
  description: string;
}): { json: X402PaymentRequiredPayload; base64Header: string } {
  const json: X402PaymentRequiredPayload = {
    x402Version: 1,
    accepts: [
      {
        scheme: 'exact',
        network: params.network,
        maxAmountRequired: `$${params.priceUsdg.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')}`,
        resource: `https://autonomo.fun/x/${params.slug}`,
        description: params.description,
        mimeType: 'application/json',
        payTo: params.payTo,
        asset: 'USDG (EIP-3009)',
      },
      {
        scheme: 'permit2',
        network: 'eip155:4663',
        maxAmountRequired: `${params.priceAutonomo.toLocaleString('en-US')} $AUTONOMO`,
        resource: `https://autonomo.fun/x/${params.slug}`,
        description: params.description,
        mimeType: 'application/json',
        payTo: params.payTo,
        asset: '0xe83c85e1ead16fcfe85401e2b337fb4fb5b5cc96',
      },
    ],
  };

  const str = JSON.stringify(json);
  const base64Header =
    typeof Buffer !== 'undefined'
      ? Buffer.from(str, 'utf-8').toString('base64')
      : btoa(unescape(encodeURIComponent(str)));

  return { json, base64Header };
}

export interface GatewayFormInput {
  name: string;
  slug: string;
  upstreamUrl: string;
  priceUsdg: string;
  priceAutonomo: string;
  payTo: string;
}

export function validateGatewayInput(input: GatewayFormInput): {
  valid: boolean;
  error: string | null;
} {
  if (!input.name.trim() || input.name.trim().length < 2) {
    return { valid: false, error: 'Enter an API project name (at least 2 characters).' };
  }
  if (!input.slug.trim() || !/^[a-z0-9-]+$/.test(input.slug.trim())) {
    return {
      valid: false,
      error: 'Gateway slug must contain only lowercase letters, numbers, and hyphens.',
    };
  }
  if (!input.upstreamUrl.trim().startsWith('https://')) {
    return {
      valid: false,
      error: 'Upstream API URL must be public and start with https://',
    };
  }
  const usdg = Number(input.priceUsdg);
  if (!Number.isFinite(usdg) || usdg <= 0 || usdg > 1000) {
    return {
      valid: false,
      error: 'Enter a valid per-call price in USDG between 0.0001 and 1,000.',
    };
  }
  const auto = Number(input.priceAutonomo);
  if (!Number.isFinite(auto) || auto <= 0) {
    return {
      valid: false,
      error: 'Enter a valid per-call price in $AUTONOMO greater than 0.',
    };
  }
  if (!/^0x[a-fA-F0-9]{6,40}$/.test(input.payTo.trim())) {
    return {
      valid: false,
      error: 'Enter a valid EVM destination wallet address starting with 0x.',
    };
  }
  return { valid: true, error: null };
}

export interface FilterableProject {
  id: string;
  name: string;
  category: 'service' | 'facilitator' | 'sdk' | 'extension' | 'explorer';
  networks: string[];
  minPriceUsd: number | null;
  calls30d: number;
  createdAtOrder: number;
  description: string;
  host: string;
}

export function filterAndSortProjects<T extends FilterableProject>(
  projects: T[],
  options: {
    query: string;
    category: string;
    network: string;
    sort: 'popular' | 'new' | 'price' | 'name';
  }
): T[] {
  const q = options.query.trim().toLowerCase();
  const filtered = projects.filter((p) => {
    if (options.category && options.category !== 'all' && p.category !== options.category) {
      return false;
    }
    if (
      options.network &&
      options.network !== 'any' &&
      !p.networks.some((n) => n.toLowerCase() === options.network.toLowerCase())
    ) {
      return false;
    }
    if (q) {
      const hay = `${p.name} ${p.description} ${p.host} ${p.networks.join(' ')}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return [...filtered].sort((a, b) => {
    if (options.sort === 'popular') {
      return b.calls30d - a.calls30d;
    }
    if (options.sort === 'new') {
      return b.createdAtOrder - a.createdAtOrder;
    }
    if (options.sort === 'price') {
      const pa = a.minPriceUsd ?? Number.POSITIVE_INFINITY;
      const pb = b.minPriceUsd ?? Number.POSITIVE_INFINITY;
      return pa - pb;
    }
    return a.name.localeCompare(b.name);
  });
}
