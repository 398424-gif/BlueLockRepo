import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { PlayerStats } from '../types.ts';

interface EgoRadarChartProps {
  stats1: PlayerStats;
  name1: string;
  color1?: string;
  stats2?: PlayerStats | null;
  name2?: string;
  color2?: string;
  isAwakened?: boolean;
}

export const EgoRadarChart: React.FC<EgoRadarChartProps> = ({
  stats1,
  name1,
  color1 = '#00f0ff',
  stats2,
  name2,
  color2 = '#f43f5e',
  isAwakened = false,
}) => {
  const chartData = [
    { subject: 'OFFENSE', key: 'offense', A: stats1.offense, B: stats2 ? stats2.offense : undefined },
    { subject: 'SHOOT', key: 'shoot', A: stats1.shoot, B: stats2 ? stats2.shoot : undefined },
    { subject: 'DRIBBLE', key: 'dribble', A: stats1.dribble, B: stats2 ? stats2.dribble : undefined },
    { subject: 'PASS', key: 'pass', A: stats1.pass, B: stats2 ? stats2.pass : undefined },
    { subject: 'DEFENSE', key: 'defense', A: stats1.defense, B: stats2 ? stats2.defense : undefined },
    { subject: 'SPEED', key: 'speed', A: stats1.speed, B: stats2 ? stats2.speed : undefined },
  ];

  // Check if any stat > 99 for EX glow
  const hasExStat1 = Object.values(stats1).some((val) => typeof val === 'number' && val > 99);
  const hasExStat2 = stats2 ? Object.values(stats2).some((val) => typeof val === 'number' && val > 99) : false;

  return (
    <div className="relative w-full h-72 sm:h-80 md:h-96 flex items-center justify-center">
      {/* Background SVG filters */}
      <svg className="absolute w-0 h-0" aria-hidden="true" focusable="false">
        <defs>
          <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="crimsonGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="cyanGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00f0ff" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#0284c7" stopOpacity={0.2} />
          </linearGradient>
          <linearGradient id="crimsonGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#9f1239" stopOpacity={0.2} />
          </linearGradient>
          <linearGradient id="awakenedGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a855f7" stopOpacity={0.7} />
            <stop offset="100%" stopColor="#00f0ff" stopOpacity={0.3} />
          </linearGradient>
        </defs>
      </svg>

      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
          <PolarGrid stroke="#1e293b" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Chakra Petch', fontWeight: 600 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 110]}
            tickCount={6}
            stroke="#334155"
            tick={{ fill: '#64748b', fontSize: 9 }}
          />

          {/* Player 1 Radar */}
          <Radar
            name={name1}
            dataKey="A"
            stroke={isAwakened ? '#c084fc' : color1}
            strokeWidth={2.5}
            fill={isAwakened ? 'url(#awakenedGrad)' : 'url(#cyanGrad)'}
            fillOpacity={0.5}
            style={{
              filter: hasExStat1 || isAwakened ? 'url(#neonGlow)' : undefined,
              transition: 'all 0.5s ease-in-out',
            }}
          />

          {/* Player 2 Radar if provided */}
          {stats2 && (
            <Radar
              name={name2 || 'Opponent'}
              dataKey="B"
              stroke={color2}
              strokeWidth={2.5}
              fill="url(#crimsonGrad)"
              fillOpacity={0.45}
              style={{
                filter: hasExStat2 ? 'url(#crimsonGlow)' : undefined,
                transition: 'all 0.5s ease-in-out',
              }}
            />
          )}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
