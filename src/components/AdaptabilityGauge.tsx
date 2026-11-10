import React from 'react';

interface AdaptabilityGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export const AdaptabilityGauge: React.FC<AdaptabilityGaugeProps> = ({
  score,
  size = 130,
  strokeWidth = 10,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Domain 0 - 110 max
  const percentage = Math.min(100, Math.max(0, (score / 110) * 100));
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getTier = (val: number) => {
    if (val >= 100) return { label: 'S+ (GOD)', color: 'text-amber-400 border-amber-500/50 bg-amber-500/10' };
    if (val >= 95) return { label: 'S+ (TRANSCENDENT)', color: 'text-cyan-400 border-cyan-500/50 bg-cyan-500/10' };
    if (val >= 90) return { label: 'S (WORLD-CLASS)', color: 'text-blue-400 border-blue-500/50 bg-blue-500/10' };
    if (val >= 80) return { label: 'A (NATIONAL ELITE)', color: 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10' };
    if (val >= 70) return { label: 'B (STANDARD EGOIST)', color: 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10' };
    return { label: 'C (RAW DIAMOND)', color: 'text-slate-400 border-slate-500/50 bg-slate-500/10' };
  };

  const tier = getTier(score);
  const isEX = score > 99;

  return (
    <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900/60 border border-slate-800">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={isEX ? '#f59e0b' : '#00f0ff'}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              transition: 'stroke-dashoffset 0.8s ease-in-out',
              filter: isEX ? 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.7))' : 'drop-shadow(0 0 8px rgba(0, 240, 255, 0.6))',
            }}
          />
        </svg>

        {/* Center score */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold font-heading ${isEX ? 'text-amber-400 text-glow-gold' : 'text-cyan-400 text-glow-cyan'}`}>
            {score}
          </span>
          <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
            / 110 MAX
          </span>
        </div>
      </div>

      <div className="mt-2 text-center">
        <div className="text-xs font-semibold text-slate-300 font-heading tracking-wider">
          MENTAL ADAPTABILITY
        </div>
        <div className={`mt-1 inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-bold ${tier.color}`}>
          {tier.label}
        </div>
      </div>
    </div>
  );
};
