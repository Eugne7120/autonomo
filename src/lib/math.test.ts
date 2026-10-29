import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateJoinSplit,
  getBrickFillCount,
  brickIndexToPercent,
  buildX402HeaderPayload,
  validateGatewayInput,
  filterAndSortProjects,
} from './math';

test('calculateJoinSplit computes exact base-unit split without floating point drift', () => {
  const res = calculateJoinSplit('1000', 75);
  assert.equal(res.isValid, true);
  assert.equal(res.totalFormatted, '1,000.00');
  assert.equal(res.intentFormatted, '750.00');
  assert.equal(res.changeFormatted, '250.00');
  assert.equal(res.intentRatio, 75);
  assert.equal(res.changeRatio, 25);
});

test('calculateJoinSplit preserves 65% preset and rejects invalid input', () => {
  const res65 = calculateJoinSplit('2500.50', 65);
  assert.equal(res65.isValid, true);
  assert.equal(res65.intentRatio, 65);
  assert.equal(res65.changeRatio, 35);
  assert.equal(res65.intentFormatted, '1,625.325');
  assert.equal(res65.changeFormatted, '875.175');

  const invalid = calculateJoinSplit('-10', 50);
  assert.equal(invalid.isValid, false);
});

test('Isometric brick strip helpers map 16 bricks cleanly while keeping exact percent in state', () => {
  assert.equal(getBrickFillCount(65), 10);
  assert.equal(getBrickFillCount(75), 12);
  assert.equal(getBrickFillCount(0), 0);
  assert.equal(getBrickFillCount(100), 16);
  assert.equal(brickIndexToPercent(12), 75);
  assert.equal(brickIndexToPercent(8), 50);
});

test('buildX402HeaderPayload encodes valid base64 x402 PAYMENT-REQUIRED header', () => {
  const { json, base64Header } = buildX402HeaderPayload({
    slug: 'token-price',
    priceUsdg: 0.01,
    priceAutonomo: 1000,
    network: 'eip155:4663',
    payTo: '0xe83c85e1ead16fcfe85401e2b337fb4fb5b5cc96',
    description: 'Live $AUTONOMO token price',
  });
  assert.equal(json.x402Version, 1);
  assert.equal(json.accepts.length, 2);
  assert.equal(json.accepts[0].maxAmountRequired, '$0.01');
  assert.ok(base64Header.length > 20);
});

test('validateGatewayInput validates required fields and HTTPS URL', () => {
  assert.equal(
    validateGatewayInput({
      name: 'Weather Gateway',
      slug: 'weather-api',
      upstreamUrl: 'https://api.weather.com/v1',
      priceUsdg: '0.01',
      priceAutonomo: '1000',
      payTo: '0xe83c85e1ead16fcfe85401e2b337fb4fb5b5cc96',
    }).valid,
    true
  );

  assert.equal(
    validateGatewayInput({
      name: 'Bad URL',
      slug: 'bad-url',
      upstreamUrl: 'http://insecure.com',
      priceUsdg: '0.01',
      priceAutonomo: '1000',
      payTo: '0xe83c85e1ead16fcfe85401e2b337fb4fb5b5cc96',
    }).valid,
    false
  );
});

test('filterAndSortProjects filters by category, network, query and sorts accurately', () => {
  const sample = [
    {
      id: '1',
      name: 'AX1 Console',
      category: 'service' as const,
      networks: ['Base'],
      minPriceUsd: 0.02,
      calls30d: 155400,
      createdAtOrder: 2,
      description: 'Onchain verdict',
      host: 'www.ax1.vc',
    },
    {
      id: '2',
      name: 'Token Price',
      category: 'service' as const,
      networks: ['Robinhood Chain'],
      minPriceUsd: 0.01,
      calls30d: 48200,
      createdAtOrder: 5,
      description: 'Live $AUTONOMO price',
      host: 'autonomo.fun/x/token-price',
    },
    {
      id: '3',
      name: 'Coinbase CDP Facilitator',
      category: 'facilitator' as const,
      networks: ['Base', 'Solana'],
      minPriceUsd: null,
      calls30d: 890000,
      createdAtOrder: 1,
      description: 'Verifies and settles x402 payments',
      host: 'cdp.coinbase.com',
    },
  ];

  const robinhoodOnly = filterAndSortProjects(sample, {
    query: '',
    category: 'all',
    network: 'Robinhood Chain',
    sort: 'popular',
  });
  assert.equal(robinhoodOnly.length, 1);
  assert.equal(robinhoodOnly[0].name, 'Token Price');

  const cheapestServices = filterAndSortProjects(sample, {
    query: '',
    category: 'service',
    network: 'any',
    sort: 'price',
  });
  assert.equal(cheapestServices.length, 2);
  assert.equal(cheapestServices[0].name, 'Token Price');
});
