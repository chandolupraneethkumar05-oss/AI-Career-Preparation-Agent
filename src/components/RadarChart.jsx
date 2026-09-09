import React from 'react';

export default function RadarChart({
  dimensions = [],
  size = 360,
  className = ''
}) {
  if (!dimensions || dimensions.length === 0) return null;

  const width = size;
  const height = size;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 55; // Leave margin for labels
  const totalAxes = dimensions.length;

  // Compute angle for each dimension (starting from top, clockwise)
  const getCoordinates = (index, valueRatio) => {
    const angle = (index * 2 * Math.PI) / totalAxes - Math.PI / 2;
    const x = centerX + radius * valueRatio * Math.cos(angle);
    const y = centerY + radius * valueRatio * Math.sin(angle);
    return { x, y, angle };
  };

  // Levels for concentric grid polygons (25%, 50%, 75%, 100%)
  const levels = [0.25, 0.5, 0.75, 1.0];

  // Polygon points string for the candidate data
  const dataPoints = dimensions
    .map((dim, idx) => {
      const ratio = Math.min(1, Math.max(0, dim.score / 100));
      const { x, y } = getCoordinates(idx, ratio);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        <defs>
          <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.4" />
            <stop offset="70%" stopColor="#06B6D4" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#0F1026" stopOpacity="0.0" />
          </radialGradient>

          <linearGradient id="polygonStrokeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="50%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#22C55E" />
          </linearGradient>

          <filter id="radarDropShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#06B6D4" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Background Ambient Radial Glow */}
        <circle cx={centerX} cy={centerY} r={radius} fill="url(#radarGlow)" />

        {/* Concentric Grid Webs */}
        {levels.map((level, levelIdx) => {
          const webPoints = dimensions
            .map((_, idx) => {
              const { x, y } = getCoordinates(idx, level);
              return `${x},${y}`;
            })
            .join(' ');

          return (
            <g key={levelIdx}>
              <polygon
                points={webPoints}
                fill="none"
                stroke="rgba(165, 180, 252, 0.15)"
                strokeWidth={level === 1 ? '1.5' : '1'}
                strokeDasharray={level === 1 ? 'none' : '3 3'}
              />
              {/* Level indicator text */}
              <text
                x={centerX + 4}
                y={centerY - radius * level + 10}
                fill="rgba(165, 180, 252, 0.4)"
                fontSize="9"
                fontFamily="monospace"
              >
                {Math.round(level * 100)}%
              </text>
            </g>
          );
        })}

        {/* Radial Axis Lines */}
        {dimensions.map((_, idx) => {
          const { x, y } = getCoordinates(idx, 1);
          return (
            <line
              key={idx}
              x1={centerX}
              y1={centerY}
              x2={x}
              y2={y}
              stroke="rgba(124, 58, 237, 0.25)"
              strokeWidth="1.2"
            />
          );
        })}

        {/* Candidate Data Polygon */}
        <polygon
          points={dataPoints}
          fill="rgba(6, 182, 212, 0.25)"
          stroke="url(#polygonStrokeGrad)"
          strokeWidth="2.5"
          filter="url(#radarDropShadow)"
          className="transition-all duration-700 ease-out"
        />

        {/* Vertex Markers & Outer Dimension Labels */}
        {dimensions.map((dim, idx) => {
          const ratio = Math.min(1, Math.max(0, dim.score / 100));
          const point = getCoordinates(idx, ratio);
          const outer = getCoordinates(idx, 1.22); // Placement for label

          // Determine text anchor based on X position relative to center
          let textAnchor = 'middle';
          if (outer.x < centerX - 15) textAnchor = 'end';
          else if (outer.x > centerX + 15) textAnchor = 'start';

          return (
            <g key={idx}>
              {/* Vertex Circle */}
              <circle
                cx={point.x}
                cy={point.y}
                r="4.5"
                fill="#06B6D4"
                stroke="#0F1026"
                strokeWidth="2"
                className="transition-all duration-700"
              />
              <circle
                cx={point.x}
                cy={point.y}
                r="7"
                fill="none"
                stroke="#A855F7"
                strokeWidth="1"
                opacity="0.6"
              />

              {/* Label and Score */}
              <text
                x={outer.x}
                y={outer.y - 4}
                textAnchor={textAnchor}
                fill="#F8FAFC"
                fontSize="11"
                fontWeight="700"
                className="select-none"
              >
                {dim.name}
              </text>
              <text
                x={outer.x}
                y={outer.y + 10}
                textAnchor={textAnchor}
                fill={dim.score >= 80 ? '#22C55E' : dim.score >= 70 ? '#06B6D4' : '#EC4899'}
                fontSize="10"
                fontWeight="800"
                fontFamily="monospace"
              >
                {dim.score}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
