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
          {/* Subtle area fill using theme primary accent */}
          <linearGradient id="chartAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--theme-primary, #1A365D)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--theme-primary, #1A365D)" stopOpacity="0.0" />
          </linearGradient>
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
                stroke="var(--theme-border, #E5E0D5)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <text
                x={paddingX - 16}
                y={y + 3.5}
                textAnchor="end"
                fill="var(--theme-text-muted, #70685E)"
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
          stroke="var(--theme-primary, #1A365D)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
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
              {/* Highlight Ring for Current Point */}
              {isCurrent && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="10"
                  fill="var(--theme-primary, #1A365D)"
                  fillOpacity="0.15"
                />
              )}

              {/* Data Point Dot */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isHovered ? 6 : isCurrent ? 5 : 4}
                fill={isCurrent ? 'var(--theme-primary, #1A365D)' : 'var(--theme-surface, #FFFDF9)'}
                stroke="var(--theme-primary, #1A365D)"
                strokeWidth={isCurrent ? '2' : '1.5'}
                className="transition-all duration-200"
              />

              {/* Score Value Pill */}
              <g transform={`translate(${pt.x}, ${pt.y - 14})`}>
                <rect
                  x="-14"
                  y="-12"
                  width="28"
                  height="16"
                  rx="3"
                  fill="var(--theme-surface, #FFFDF9)"
                  stroke="var(--theme-border, #E5E0D5)"
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="0"
                  textAnchor="middle"
                  fill="var(--theme-text, #1F1B16)"
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
                fill={isCurrent ? 'var(--theme-primary, #1A365D)' : 'var(--theme-text-muted, #70685E)'}
                fontSize="10"
                fontFamily="ui-monospace, monospace"
                fontWeight={isCurrent ? 'bold' : 'normal'}
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
