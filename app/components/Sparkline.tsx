export default function Sparkline({
  values,
  width = 96,
  height = 28,
}: {
  values: number[];
  width?: number;
  height?: number;
}) {
  const total = values.reduce((n, x) => n + x, 0);
  if (values.length === 0 || total === 0) {
    return (
      <svg
        className="spark"
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        preserveAspectRatio="none"
        aria-hidden
      >
        <line
          x1="0"
          y1={height - 1}
          x2={width}
          y2={height - 1}
          className="spark-flat"
        />
      </svg>
    );
  }

  const max = Math.max(...values, 1);
  const pad = 2;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const step = values.length > 1 ? innerW / (values.length - 1) : 0;

  const points = values.map((v, i) => {
    const x = pad + i * step;
    const y = pad + innerH - (v / max) * innerH;
    return [x, y] as const;
  });

  const linePath = points.map(([x, y]) => `${x},${y}`).join(" ");
  const areaPath =
    `${pad},${height - pad} ` +
    points.map(([x, y]) => `${x},${y}`).join(" ") +
    ` ${pad + innerW},${height - pad}`;

  return (
    <svg
      className="spark"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      preserveAspectRatio="none"
      aria-hidden
    >
      <polygon points={areaPath} className="spark-area" />
      <polyline points={linePath} className="spark-line" />
    </svg>
  );
}
