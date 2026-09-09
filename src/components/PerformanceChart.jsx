import React, { useState } from 'react';

/**
 * PerformanceChart
 * 
 * Zero-dependency pure SVG performance line chart for InterviewAI.
 * Renders smooth curved polyline, gradient area fill, gridlines,
 * score badges, and interactive point hover states.
 */
export default function PerformanceChart({
  data = [
    { label: 'Interview 1', shortLabel: 'Int 1', score: 68 },
    { label: 'Interview 2', shortLabel: 'Int 2', score: 72 },
    { label: 'Interview 3', shortLabel: 'Int 3', score: 75 },
    { label: 'Interview 4', shortLabel: 'Int 4', score: 78 },
    { label: 'Current', shortLabel: 'Current', score: 82 }
  ],
  height = 200,
  className = ''
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) return null;

  const width = 520;
  const paddingX = 45;
  const paddingTop = 32;
  const paddingBottom = 34;
  const innerHeight = height - paddingTop - paddingBottom;
  const innerWidth = width - paddingX * 2;

  const minScore = 55;
  const maxScore = 95;
  const scoreRange = maxScore - minScore;

  // Compute (x, y) coordinates for each data point
  const points = data.map((item, idx) => {
    const x = paddingX + (idx / (data.length - 1)) * innerWidth;
    const clampedScore = Math.max(minScore, Math.min(maxScore, item.score));
    const ratio = (clampedScore - minScore) / scoreRange;
    const y = height - paddingBottom - ratio * innerHeight;
    return { ...item, x, y, idx };
  });

  // Generate smooth cubic bezier SVG path
  const generateSmoothPath = (pts) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      path += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  const linePath = generateSmoothPath(points);
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const bottomY = height - paddingBottom;
  const areaPath = `${linePath} L ${lastPoint.x} ${bottomY} L ${firstPoint.x} ${bottomY} Z`;

  // Grid lines at 60, 70, 80, 90
  const gridValues = [60, 70, 80, 90];

  return (
    <div className={`w-full select-none ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
      >
        <defs>
          {/* Gradient area fill */}
          <linearGradient id="chartAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.45" />
            <stop offset="55%" stopColor="#06B6D4" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#0F1026" stopOpacity="0.0" />
          </linearGradient>

          {/* Stroke gradient */}
          <linearGradient id="chartStrokeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="50%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#22C55E" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="chartGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#06B6D4" floodOpacity="0.45" />
          </filter>
        </defs>

        {/* Horizontal Grid lines and labels */}
        {gridValues.map((val) => {
          const ratio = (val - minScore) / scoreRange;
          const y = height - paddingBottom - ratio * innerHeight;
          return (
            <g key={val}>
              <line
                x1={paddingX - 10}
                y1={y}
                x2={width - paddingX + 10}
                y2={y}
                stroke="#A5B4FC"
                strokeOpacity="0.12"
                strokeDasharray="4 4"
              />
              <text
                x={paddingX - 16}
                y={y + 3.5}
                textAnchor="end"
                fill="#A5B4FC"
                fillOpacity="0.5"
                fontSize="9.5"
                fontFamily="ui-monospace, monospace"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Gradient Area */}
        <path d={areaPath} fill="url(#chartAreaGradient)" />

        {/* Main Line Stroke */}
        <path
          d={linePath}
          fill="none"
          stroke="url(#chartStrokeGradient)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#chartGlow)"
        />

        {/* Data Points and Badges */}
        {points.map((pt, idx) => {
          const isCurrent = idx === points.length - 1;
          const isHovered = hoveredIdx === idx;

          return (
            <g
              key={idx}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Highlight Pulse Ring for Current Point */}
              {isCurrent && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="12"
                  fill="#06B6D4"
                  fillOpacity="0.2"
                  className="animate-pulse"
                />
              )}

              {/* Data Point Dot */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isHovered ? 6.5 : isCurrent ? 5.5 : 4.5}
                fill={isCurrent ? '#06B6D4' : '#191A3A'}
                stroke={isCurrent ? '#F8FAFC' : '#A855F7'}
                strokeWidth={isCurrent ? '2.5' : '2'}
                className="transition-all duration-200"
              />

              {/* Score Value Pill */}
              <g transform={`translate(${pt.x}, ${pt.y - 14})`}>
                <rect
                  x="-14"
                  y="-12"
                  width="28"
                  height="16"
                  rx="6"
                  fill={isCurrent ? '#06B6D4' : '#191A3A'}
                  stroke={isCurrent ? '#22C55E' : '#7C3AED'}
                  strokeWidth="1"
                  strokeOpacity={isCurrent ? '0.9' : '0.4'}
                  fillOpacity={isCurrent ? '0.95' : '0.8'}
                />
                <text
                  x="0"
                  y="0"
                  textAnchor="middle"
                  fill={isCurrent ? '#0F1026' : '#F8FAFC'}
                  fontSize="9.5"
                  fontWeight="bold"
                  fontFamily="ui-monospace, monospace"
                >
                  {pt.score}
                </text>
              </g>

              {/* X-axis Label */}
              <text
                x={pt.x}
                y={height - 12}
                textAnchor="middle"
                fill={isCurrent ? '#06B6D4' : '#A5B4FC'}
                fillOpacity={isCurrent ? 1 : 0.75}
                fontSize="10.5"
                fontWeight={isCurrent ? 'bold' : '500'}
              >
                {pt.shortLabel || pt.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
