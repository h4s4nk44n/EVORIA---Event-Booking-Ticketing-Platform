import type { Archetype, Tier, TierKey, SeatSection } from '../types';

export const TIERS: Record<TierKey, Tier> = {
  vip: { color: '#7C3AED', label: 'VIP', range: '$150+', hex: '#7C3AED' },
  premium: { color: '#14B8A6', label: 'Premium', range: '$75–100', hex: '#14B8A6' },
  standard: { color: '#6366F1', label: 'Standard', range: '$40–75', hex: '#6366F1' },
  budget: { color: '#F59E0B', label: 'Budget', range: '$25–40', hex: '#F59E0B' },
  soldout: { color: '#6B7280', label: 'Sold Out', range: '—', hex: '#6B7280' },
};

// Stadium: concentric arcs facing a stage at the bottom
const buildStadium = (): Archetype => {
  const cx = 500, cy = 620;
  const R = [170, 260, 350, 430, 500];
  const polar = (r: number, deg: number): [number, number] => [
    cx + Math.cos((deg * Math.PI) / 180) * r,
    cy + Math.sin((deg * Math.PI) / 180) * r,
  ];
  const wedge = (rIn: number, rOut: number, d1: number, d2: number) => {
    const [ax, ay] = polar(rOut, d1);
    const [bx, by] = polar(rOut, d2);
    const [cxI, cyI] = polar(rIn, d2);
    const [dxI, dyI] = polar(rIn, d1);
    const large = d2 - d1 > 180 ? 1 : 0;
    return `M ${ax.toFixed(1)} ${ay.toFixed(1)} A ${rOut} ${rOut} 0 ${large} 1 ${bx.toFixed(1)} ${by.toFixed(1)} L ${cxI.toFixed(1)} ${cyI.toFixed(1)} A ${rIn} ${rIn} 0 ${large} 0 ${dxI.toFixed(1)} ${dyI.toFixed(1)} Z`;
  };
  const gap = 1.5;
  const R1: [number, number][] = [[205, 240], [240, 300], [300, 335]];
  const R2: [number, number][] = [[200, 240], [240, 300], [300, 340]];
  const R3: [number, number][] = [[195, 235], [235, 305], [305, 345]];
  const R4: [number, number][] = [[190, 230], [230, 310], [310, 350]];
  const W = (ri: number, [a, b]: [number, number]) => wedge(R[ri], R[ri + 1], a + gap, b - gap);

  const sections: SeatSection[] = [
    { id: 'vip-left', name: 'VIP Left', tier: 'vip', price: 180, capacity: 180, sold: 90, path: W(0, R1[0]) },
    { id: 'vip-center', name: 'VIP Pit', tier: 'vip', price: 220, capacity: 220, sold: 210, path: W(0, R1[1]) },
    { id: 'vip-right', name: 'VIP Right', tier: 'vip', price: 180, capacity: 180, sold: 140, path: W(0, R1[2]) },
    { id: 'prem-left', name: 'Lower Left', tier: 'premium', price: 85, capacity: 360, sold: 60, path: W(1, R2[0]) },
    { id: 'prem-center', name: 'Lower Center', tier: 'premium', price: 95, capacity: 420, sold: 395, path: W(1, R2[1]) },
    { id: 'prem-right', name: 'Lower Right', tier: 'premium', price: 85, capacity: 360, sold: 310, path: W(1, R2[2]) },
    { id: 'std-left', name: 'Upper Left', tier: 'standard', price: 55, capacity: 540, sold: 120, path: W(2, R3[0]) },
    { id: 'std-center', name: 'Upper Center', tier: 'standard', price: 65, capacity: 720, sold: 400, path: W(2, R3[1]) },
    { id: 'std-right', name: 'Upper Right', tier: 'standard', price: 55, capacity: 540, sold: 540, soldOut: true, path: W(2, R3[2]) },
    { id: 'bud-left', name: 'Far Left', tier: 'budget', price: 35, capacity: 820, sold: 220, path: W(3, R4[0]) },
    { id: 'bud-center', name: 'Far Upper', tier: 'budget', price: 35, capacity: 1100, sold: 720, path: W(3, R4[1]) },
    { id: 'bud-right', name: 'Far Right', tier: 'budget', price: 35, capacity: 820, sold: 680, path: W(3, R4[2]) },
  ];

  return {
    label: 'Stadium · Arc',
    viewBox: '0 0 1000 540',
    stage: { type: 'rect', x: 450, y: 495, w: 100, h: 16, label: 'STAGE' },
    sections,
  };
};

const ARCHETYPE_STADIUM: Archetype = buildStadium();

const ARCHETYPE_THEATER: Archetype = {
  label: 'Theater · Stepped',
  viewBox: '0 0 800 480',
  stage: { type: 'rect', x: 240, y: 30, w: 320, h: 30, label: 'STAGE' },
  sections: [
    { id: 't-orch-l', name: 'Orchestra Left', tier: 'vip', price: 180, capacity: 120, sold: 84, path: 'M 120 90 L 360 90 L 360 170 L 120 170 Z' },
    { id: 't-orch-c', name: 'Orchestra Center', tier: 'vip', price: 220, capacity: 160, sold: 152, path: 'M 360 90 L 440 90 L 440 170 L 360 170 Z' },
    { id: 't-orch-r', name: 'Orchestra Right', tier: 'vip', price: 180, capacity: 120, sold: 110, path: 'M 440 90 L 680 90 L 680 170 L 440 170 Z' },
    { id: 't-mez-l', name: 'Mezz Left', tier: 'premium', price: 95, capacity: 180, sold: 60, path: 'M 100 190 L 380 190 L 380 280 L 100 280 Z' },
    { id: 't-mez-c', name: 'Mezz Center', tier: 'premium', price: 100, capacity: 180, sold: 180, soldOut: true, path: 'M 380 190 L 420 190 L 420 280 L 380 280 Z' },
    { id: 't-mez-r', name: 'Mezz Right', tier: 'premium', price: 95, capacity: 180, sold: 140, path: 'M 420 190 L 700 190 L 700 280 L 420 280 Z' },
    { id: 't-bal-l', name: 'Balcony Left', tier: 'standard', price: 60, capacity: 220, sold: 90, path: 'M 80 300 L 380 300 L 380 390 L 80 390 Z' },
    { id: 't-bal-c', name: 'Balcony Center', tier: 'standard', price: 75, capacity: 220, sold: 210, path: 'M 380 300 L 420 300 L 420 390 L 380 390 Z' },
    { id: 't-bal-r', name: 'Balcony Right', tier: 'standard', price: 60, capacity: 220, sold: 160, path: 'M 420 300 L 720 300 L 720 390 L 420 390 Z' },
    { id: 't-gal-l', name: 'Gallery Left', tier: 'budget', price: 32, capacity: 300, sold: 50, path: 'M 60 410 L 380 410 L 380 460 L 60 460 Z' },
    { id: 't-gal-r', name: 'Gallery Right', tier: 'budget', price: 32, capacity: 300, sold: 240, path: 'M 420 410 L 740 410 L 740 460 L 420 460 Z' },
  ],
};

const buildArena = (): Archetype => {
  const cx = 400, cy = 240;
  const tiers: TierKey[] = ['vip', 'premium', 'premium', 'standard', 'standard', 'budget', 'budget', 'standard', 'standard', 'premium', 'premium', 'vip'];
  const prices = [180, 95, 95, 55, 55, 35, 35, 55, 55, 95, 95, 180];
  const sold = [150, 180, 280, 400, 540, 220, 680, 120, 140, 160, 60, 120];
  const cap = [160, 220, 280, 420, 540, 300, 700, 240, 240, 220, 220, 160];
  const rxIn = 180, ryIn = 110, rxOut = 300, ryOut = 200;
  const N = 12;
  const sections: SeatSection[] = [];
  for (let i = 0; i < N; i++) {
    const gap = 0.02;
    const a0 = -Math.PI / 2 + i * ((Math.PI * 2) / N) + gap;
    const a1 = -Math.PI / 2 + (i + 1) * ((Math.PI * 2) / N) - gap;
    const p = (a: number, rx: number, ry: number): [string, string] => [
      (cx + Math.cos(a) * rx).toFixed(1),
      (cy + Math.sin(a) * ry).toFixed(1),
    ];
    const [x0, y0] = p(a0, rxIn, ryIn);
    const [x1, y1] = p(a1, rxIn, ryIn);
    const [x2, y2] = p(a1, rxOut, ryOut);
    const [x3, y3] = p(a0, rxOut, ryOut);
    const path = `M ${x0} ${y0} A ${rxIn} ${ryIn} 0 0 1 ${x1} ${y1} L ${x2} ${y2} A ${rxOut} ${ryOut} 0 0 0 ${x3} ${y3} Z`;
    sections.push({
      id: `a-${i + 1}`,
      name: `Section ${100 + i + 1}`,
      tier: tiers[i],
      price: prices[i],
      capacity: cap[i],
      sold: sold[i],
      soldOut: sold[i] >= cap[i],
      path,
    });
  }
  return {
    label: 'Arena · Oval',
    viewBox: '0 0 800 480',
    stage: { type: 'rect', x: 340, y: 220, w: 120, h: 40, label: 'PITCH' },
    sections,
  };
};

const ARCHETYPE_ARENA = buildArena();

export type ArchetypeKey = 'stadium' | 'theater' | 'arena';

export const ARCHETYPES: Record<ArchetypeKey, Archetype> = {
  stadium: ARCHETYPE_STADIUM,
  theater: ARCHETYPE_THEATER,
  arena: ARCHETYPE_ARENA,
};
