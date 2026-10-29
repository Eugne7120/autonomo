import React from 'react';
import { getBrickFillCount, brickIndexToPercent } from '../../lib/math';

interface IsometricBrickStripProps {
  valuePercent: number;
  onChangePercent: (newPercent: number) => void;
  label?: string;
}

/**
 * 16-unit three-face extruded SVG isometric prism strip + exact 1% slider.
 * Preserves exact 1% values (e.g. 65% preset stays 65% while lighting 10 bricks).
 */
export const IsometricBrickStrip: React.FC<IsometricBrickStripProps> = ({
  valuePercent,
  onChangePercent,
  label = 'Join-Split Ratio',
}) => {
  const filledCount = getBrickFillCount(valuePercent);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-[#d4d4d8]">{label}</span>
        <div className="font-mono tabular-nums text-[#f4f4f6]">
          <span className="text-[#00C805] font-semibold">{valuePercent}% Intent</span>
          <span className="mx-1.5 text-[#8b8b97]">/</span>
          <span className="text-[#a1a1aa]">{100 - valuePercent}% Shielded Change</span>
        </div>
      </div>

      {/* 16 Extruded Isometric SVG Prisms */}
      <div
        className="grid grid-cols-16 gap-1 pt-2 pb-1 px-2 rounded-xl bg-[#08090c] border border-white/10"
        role="group"
        aria-label={`${label} coarse brick selector (${valuePercent}%)`}
      >
        {Array.from({ length: 16 }, (_, idx) => {
          const brickNumber = idx + 1;
          const isFilled = brickNumber <= filledCount;
          const coarsePercent = brickIndexToPercent(brickNumber);

          return (
            <button
              key={brickNumber}
              type="button"
              onClick={() => onChangePercent(coarsePercent)}
              aria-label={`Set split to ${coarsePercent}% (${brickNumber} of 16 bricks)`}
              aria-pressed={isFilled}
              className={`group relative flex flex-col items-center justify-center py-1.5 rounded transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-white ${
                isFilled ? '-translate-y-1' : 'hover:-translate-y-0.5 opacity-60 hover:opacity-90'
              }`}
            >
              <svg
                viewBox="0 0 28 38"
                className="w-full h-8 overflow-visible"
                aria-hidden="true"
              >
                {/* Top isometric diamond face */}
                <polygon
                  points="14,2 26,8 14,14 2,8"
                  fill={isFilled ? '#34d399' : '#272a36'}
                />
                {/* Left isometric extruded face */}
                <polygon
                  points="2,8 14,14 14,34 2,28"
                  fill={isFilled ? '#00C805' : '#181920'}
                />
                {/* Right isometric extruded face */}
                <polygon
                  points="14,14 26,8 26,28 14,34"
                  fill={isFilled ? '#059669' : '#12141b'}
                />
              </svg>
            </button>
          );
        })}
      </div>

      {/* Exact 1% Precision Slider + Numeric Input */}
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={valuePercent}
          onChange={(e) => onChangePercent(Number(e.target.value))}
          aria-label={`${label} exact percentage slider`}
          className="flex-1 accent-[#00C805] h-1.5 bg-[#20232b] rounded-lg cursor-pointer"
        />
        <div className="flex items-center gap-1 bg-[#12141b] border border-white/10 rounded-lg px-2.5 py-1">
          <input
            type="number"
            min={0}
            max={100}
            value={valuePercent}
            onChange={(e) => {
              const v = Math.max(0, Math.min(100, Math.round(Number(e.target.value) || 0)));
              onChangePercent(v);
            }}
            aria-label={`${label} exact percentage number`}
            className="w-11 bg-transparent text-right font-mono text-xs text-[#f4f4f6] focus:outline-none tabular-nums"
          />
          <span className="text-xs font-mono text-[#8b8b97]">%</span>
        </div>
      </div>
    </div>
  );
};
