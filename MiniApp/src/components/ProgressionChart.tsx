import React from 'react';
import type { UserRecord } from '../utils/types';

interface ProgressionChartProps {
  records: UserRecord[];
  chartCategory: 'bench' | 'dips' | 'pullups' | 'other';
}

export const ProgressionChart: React.FC<ProgressionChartProps> = ({ records, chartCategory }) => {
  const filtered = records
    .filter(r => r.category === chartCategory)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (filtered.length < 2) {
    return (
      <div className="chart-empty-state">
        <p>Добавьте хотя бы 2 рекорда в выбранной категории, чтобы увидеть график прогресса 1ПМ</p>
      </div>
    );
  }

  const width = 500;
  const height = 250;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const values = filtered.map(r => r.onePm);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  
  const valRange = maxVal - minVal;
  const paddingFactor = valRange === 0 ? 10 : valRange * 0.15;
  const minY = Math.max(0, minVal - paddingFactor);
  const maxY = maxVal + paddingFactor;

  const points = filtered.map((r, i) => {
    const x = paddingLeft + (i / (filtered.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((r.onePm - minY) / (maxY - minY)) * chartHeight;
    return { x, y, record: r };
  });

  const dStr = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const fillStr = `${dStr} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;

  const yGridValues = [minY + paddingFactor, (minY + maxY) / 2, maxY - paddingFactor];

  return (
    <div className="chart-wrapper">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} className="progress-chart-svg">
        <defs>
          <linearGradient id="chart-fill-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
          </linearGradient>
          <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Сетка Y-оси */}
        {yGridValues.map((val, idx) => {
          const y = paddingTop + chartHeight - ((val - minY) / (maxY - minY)) * chartHeight;
          return (
            <g key={idx}>
              <line 
                x1={paddingLeft} 
                y1={y} 
                x2={width - paddingRight} 
                y2={y} 
                stroke="#1e293b" 
                strokeWidth="1" 
                strokeDasharray="4 4" 
              />
              <text 
                x={paddingLeft - 8} 
                y={y + 4} 
                fill="#94a3b8" 
                fontSize="10" 
                textAnchor="end"
              >
                {Math.round(val)}
              </text>
            </g>
          );
        })}

        <path d={fillStr} fill="url(#chart-fill-gradient)" />

        <path 
          d={dStr} 
          fill="none" 
          stroke="var(--color-primary)" 
          strokeWidth="3" 
          filter="url(#neon-glow)" 
        />

        {points.map((p, i) => {
          const formattedDate = new Date(p.record.createdAt).toLocaleDateString('ru-RU', { month: 'numeric', day: 'numeric' });
          return (
            <g key={i} className="chart-point-group">
              <circle 
                cx={p.x} 
                cy={p.y} 
                r="5" 
                fill="#10b981" 
                stroke="#060913" 
                strokeWidth="2" 
              />
              <text 
                x={p.x} 
                y={p.y - 10} 
                fill="#ffffff" 
                fontSize="9" 
                fontWeight="bold"
                textAnchor="middle"
                className="chart-point-text"
              >
                {Math.round(p.record.onePm)}
              </text>
              <text 
                x={p.x} 
                y={paddingTop + chartHeight + 18} 
                fill="#64748b" 
                fontSize="9" 
                textAnchor="middle"
              >
                {formattedDate}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
