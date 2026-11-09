import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * PerformanceChart
 * 
 * Zero-dependency pure SVG performance line chart for InterviewAI.
 * Renders smooth curved polyline, gradient area fill, gridlines,
 * score badges, and interactive point hover states with adaptive
 * label decimation to prevent overlapping when many rounds are logged.
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

  // Safe theme detection (fallback if rendered outside ThemeProvider in tests)
  let isDark = false;
  try {
    const themeContext = useTheme();
    isDark = Boolean(themeContext?.isDark);
  } catch {
    isDark = typeof document !== 'undefined' && (
      document.documentElement.classList.contains('dark') ||
      document.documentElement.getAttribute('data-theme') === 'dark' ||
      document.documentElement.getAttribute('data-theme') === 'black'
    );
  }

  if (!data || data.length === 0) return null;

  const width = 520;
  const paddingX = 45;
  const paddingTop = 34;
  const paddingBottom = 34;
  const innerHeight = height - paddingTop - paddingBottom;
  const innerWidth = width - paddingX * 2;

  const minScore = 55;
  const maxScore = 95;
  const scoreRange = maxScore - minScore;

  // Compute (x, y) coordinates for each data point
  const total = data.length;
  const points = data.map((item, idx) => {
    const x = total === 1 ? width / 2 : paddingX + (idx / (total - 1)) * innerWidth;
    const clampedScore = Math.max(minScore, Math.min(maxScore, item.score || 70));
    const ratio = (clampedScore - minScore) / scoreRange;
    const y = height - paddingBottom - ratio * innerHeight;
    return { ...item, x, y, idx };
  });

  // Calculate which labels to show on X-axis so they NEVER overlap
  const getVisibleLabelIndices = (n) => {
    if (n <= 6) {
      return new Set(Array.from({ length: n }, (_, i) => i));
    }
    const visible = new Set();
    visible.add(0); // Always first
    visible.add(n - 1); // Always last

    // Pick 3-4 evenly spaced intermediate milestones
    const intermediateCount = n > 25 ? 4 : 3;
    const step = (n - 1) / (intermediateCount + 1);
    for (let i = 1; i <= intermediateCount; i++) {
      const targetIdx = Math.round(i * step);
      if (targetIdx > 0 && targetIdx < n - 1) {
        visible.add(targetIdx);
      }
    }
    return visible;
  };

  const visibleLabelIndices = getVisibleLabelIndices(total);

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

  // Visual Theme Palettes
  const strokeLineColor = isDark ? '#6366F1' : 'var(--theme-primary, #1A365D)';
  const gridLineColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'var(--theme-border, #E5E0D5)';
  const gridTextColor = isDark ? '#A1A1AA' : 'var(--theme-text-muted, #70685E)';
  const badgeFill = isDark ? '#1F2937' : '#FFFFFF';
  const badgeBorderColor = isDark ? '#4F46E5' : 'var(--theme-border, #E2E8F0)';
  const badgeTextColor = isDark ? '#FFFFFF' : '#0F172A';
  const labelInactiveColor = isDark ? '#E2E8F0' : '#475569';
  const labelActiveColor = isDark ? '#A5B4FC' : 'var(--theme-primary, #1A365D)';

  // Determine active score pill: hovered point takes priority, otherwise the latest (last) point
  const activeBadgeIndex = hoveredIdx !== null ? hoveredIdx : points.length - 1;

  return (
    <div className={`w-full select-none ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
      >
        <defs>
          <linearGradient id="chartAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop
              offset="0%"
              stopColor={isDark ? '#6366F1' : 'var(--theme-primary, #1A365D)'}
              stopOpacity={isDark ? 0.35 : 0.18}
            />
            <stop
              offset="100%"
              stopColor={isDark ? '#6366F1' : 'var(--theme-primary, #1A365D)'}
              stopOpacity={0.0}
            />
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
                stroke={gridLineColor}
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <text
                x={paddingX - 14}
                y={y + 3.5}
                textAnchor="end"
                fill={gridTextColor}
                fontSize="10"
                fontWeight="600"
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
          stroke={strokeLineColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data Points, Badges and Cleaned X-Axis Labels */}
        {points.map((pt, idx) => {
          const isCurrent = idx === points.length - 1;
          const isHovered = hoveredIdx === idx;
          const showBadge = idx === activeBadgeIndex;
          const showXLabel = visibleLabelIndices.has(idx) || isHovered;

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
                  r={total > 30 ? 7 : 10}
                  fill={strokeLineColor}
                  fillOpacity={isDark ? 0.3 : 0.15}
                />
              )}

              {/* Data Point Dot */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isHovered ? 6 : (isCurrent ? 5 : (total > 30 ? 3 : 4))}
                fill={isCurrent || isHovered ? strokeLineColor : (isDark ? '#111827' : '#FFFFFF')}
                stroke={strokeLineColor}
                strokeWidth={isCurrent || isHovered ? '2' : '1.5'}
                className="transition-all duration-150"
              />

              {/* Score Value Pill — ONLY rendered for active point (hovered or latest) */}
              {showBadge && (
                <g transform={`translate(${pt.x}, ${pt.y - 15})`}>
                  <rect
                    x="-16"
                    y="-13"
                    width="32"
                    height="18"
                    rx="4"
                    fill={badgeFill}
                    stroke={badgeBorderColor}
                    strokeWidth="1.5"
                    className="drop-shadow-md"
                  />
                  <text
                    x="0"
                    y="0"
                    textAnchor="middle"
                    fill={badgeTextColor}
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="ui-monospace, monospace"
                  >
                    {pt.score}
                  </text>
                </g>
              )}

              {/* X-axis Label — Decimated to prevent overlapping */}
              {showXLabel && (
                <text
                  x={pt.x}
                  y={height - 12}
                  textAnchor="middle"
                  fill={isCurrent || isHovered ? labelActiveColor : labelInactiveColor}
                  fontSize="10.5"
                  fontFamily="ui-monospace, monospace"
                  fontWeight={isCurrent || isHovered ? 'bold' : '600'}
                >
                  {pt.shortLabel || pt.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
