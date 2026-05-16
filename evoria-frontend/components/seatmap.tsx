import { cx } from '../lib/utils';
import { ARCHETYPES, TIERS, type ArchetypeKey } from '../data/archetypes';
import type { SeatSection } from '../types';

type SeatMapProps = {
  archetype?: ArchetypeKey;
  selectedId?: string | null;
  onSelect?: (s: SeatSection) => void;
  compact?: boolean;
  onHover?: (s: SeatSection | null) => void;
};

export const SeatMap = ({
  archetype = 'stadium',
  selectedId = null,
  onSelect,
  compact = false,
  onHover,
}: SeatMapProps) => {
  const arc = ARCHETYPES[archetype] || ARCHETYPES.stadium;
  return (
    <div className="relative w-full">
      <svg
        viewBox={arc.viewBox}
        className="w-full h-auto select-none"
        role="img"
        aria-label={`${arc.label} seat map`}
      >
        <defs>
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <pattern id="sp-lines" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="white" strokeOpacity="0.25" strokeWidth="1" />
          </pattern>
          <radialGradient
            id="arenaLight"
            cx="50%"
            cy={arc.stage.type === 'rect' ? `${(arc.stage.y / 480) * 100}%` : '90%'}
            r="60%"
          >
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect x="0" y="0" width="800" height="480" className="fill-slate-50 dark:fill-slate-900" />
        <rect x="0" y="0" width="800" height="480" fill="url(#arenaLight)" />

        {arc.sections.map((s) => {
          const color = s.soldOut ? TIERS.soldout.hex : TIERS[s.tier].hex;
          const selected = selectedId === s.id;
          return (
            <g
              key={s.id}
              className={cx('seat-section', selected && 'selected', s.soldOut && 'sold-out')}
              style={{ color }}
              onMouseEnter={() => onHover?.(s)}
              onMouseLeave={() => onHover?.(null)}
              onClick={() => !s.soldOut && onSelect?.(s)}
            >
              <path
                d={s.path}
                fill={s.tint || color}
                fillOpacity={selected ? 0.95 : 0.8}
                stroke={selected ? '#FFFFFF' : 'rgba(15,23,42,0.25)'}
                strokeWidth={selected ? 2.5 : 1}
              />
              {s.soldOut && <path d={s.path} fill="url(#sp-lines)" />}
              {!compact && (
                <SectionLabel path={s.path} name={s.name} price={s.price} soldOut={!!s.soldOut} />
              )}
            </g>
          );
        })}

        {arc.stage?.type === 'rect' && (
          <g>
            <rect
              x={arc.stage.x}
              y={arc.stage.y}
              width={arc.stage.w}
              height={arc.stage.h}
              rx="4"
              className="fill-slate-900 dark:fill-white"
            />
            <text
              x={arc.stage.x + arc.stage.w / 2}
              y={arc.stage.y + arc.stage.h / 2 + 4}
              className="fill-white dark:fill-slate-900"
              fontSize="11"
              fontWeight="700"
              textAnchor="middle"
              letterSpacing="2"
            >
              {arc.stage.label}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

const SectionLabel = ({
  path,
  name,
  price,
  soldOut,
}: {
  path: string;
  name: string;
  price: number;
  soldOut: boolean;
}) => {
  const nums = path.match(/-?\d+(\.\d+)?/g)?.map(Number) || [];
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < nums.length - 1; i += 2) {
    xs.push(nums[i]);
    ys.push(nums[i + 1]);
  }
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  return (
    <g pointerEvents="none">
      <text x={cx} y={cy - 2} textAnchor="middle" className="fill-white" fontSize="10" fontWeight="700">
        {name.split(' ').slice(-1)[0]}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" className="fill-white/80" fontSize="9" fontWeight="500">
        {soldOut ? 'SOLD OUT' : `$${price}`}
      </text>
    </g>
  );
};

export const SeatMapLegend = ({ className = '' }: { className?: string }) => {
  const items = [
    { tier: TIERS.vip,      copy: 'VIP · $150+' },
    { tier: TIERS.premium,  copy: 'Premium · $75–100' },
    { tier: TIERS.standard, copy: 'Standard · $40–75' },
    { tier: TIERS.budget,   copy: 'Budget · $25–40' },
    { tier: TIERS.soldout,  copy: 'Sold Out' },
  ];
  return (
    <div className={cx('flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600 dark:text-slate-400', className)}>
      {items.map((it, i) => (
        <div key={i} className="inline-flex items-center gap-2">
          <span className="w-3 h-3 rounded" style={{ background: it.tier.hex }} />
          <span>{it.copy}</span>
        </div>
      ))}
    </div>
  );
};
