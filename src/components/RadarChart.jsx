import React from 'react';

export default function RadarChart({
  dimensions = [],
  size = 360,
  className = ''
}) {
  if (!dimensions || dimensions.length === 0) return null;

  const viewBoxSize = 400;
  const centerX = viewBoxSize / 2;
  const centerY = viewBoxSize / 2;
  const radius = 125; // Ample margin for outer labels within 400x400
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
    <div className={`relative w-full max-w-[360px] mx-auto aspect-square flex flex-col items-center justify-center select-none ${className}`}>
      <svg
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        className="w-full h-full"
      >
        <defs>
          <radialGradient id="radarAcademicBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FAF8F3" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FFFDF9" stopOpacity="0.0" />
          </radialGradient>
        </defs>

        {/* Background Subtle Radial Tint */}
        <circle cx={centerX} cy={centerY} r={radius} fill="url(#radarAcademicBg)" />

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
                stroke="#E5E0D5"
                strokeWidth={level === 1 ? '1.5' : '1'}
                strokeDasharray={level === 1 ? 'none' : '3 3'}
              />
              {/* Level indicator text */}
              <text
                x={centerX + 4}
                y={centerY - radius * level + 10}
                fill="#5C554B"
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
              stroke="#E5E0D5"
              strokeWidth="1"
            />
          );
        })}

        {/* Candidate Data Polygon */}
        <polygon
          points={dataPoints}
          fill="rgba(26, 54, 93, 0.12)"
          stroke="#1A365D"
          strokeWidth="2"
          className="transition-all duration-700 ease-out"
        />

        {/* Vertex Markers & Outer Dimension Labels */}
        {dimensions.map((dim, idx) => {
          const ratio = Math.min(1, Math.max(0, dim.score / 100));
          const point = getCoordinates(idx, ratio);
          const outer = getCoordinates(idx, 1.24); // Placement for label

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
                r="4"
                fill="#1A365D"
                stroke="#FFFDF9"
                strokeWidth="1.5"
                className="transition-all duration-700"
              />

              {/* Label and Score */}
              <text
                x={outer.x}
                y={outer.y - 4}
                textAnchor={textAnchor}
                fill="#1F1B16"
                fontSize="11"
                fontWeight="600"
                fontFamily="inherit"
                className="select-none"
              >
                {dim.name}
              </text>
              <text
                x={outer.x}
                y={outer.y + 10}
                textAnchor={textAnchor}
                fill={dim.score >= 80 ? '#235E3B' : dim.score >= 65 ? '#1A365D' : '#9A421A'}
                fontSize="10"
                fontWeight="700"
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
