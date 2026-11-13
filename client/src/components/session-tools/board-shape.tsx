import type { BoardElement } from "@/lib/room-activities-api";
export function BoardShape({
  element,
  selected = false,
}: {
  element: BoardElement;
  selected?: boolean;
}) {
  const { kind, points, color, width, text } = element,
    [a, b = a] = points;
  const common = {
    stroke: color,
    strokeWidth: width,
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <g
      data-element-id={element.id}
      style={selected ? { filter: "drop-shadow(0 0 5px #818cf8)" } : undefined}
    >
      {kind === "pencil" &&
        (points.length === 1 ? (
          <circle cx={a[0]} cy={a[1]} r={width / 2} fill={color} />
        ) : (
          <polyline
            {...common}
            points={points.map((p) => p.join(",")).join(" ")}
          />
        ))}
      {kind === "line" && (
        <line {...common} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
      )}
      {kind === "square" && (
        <rect
          {...common}
          x={Math.min(a[0], b[0])}
          y={Math.min(a[1], b[1])}
          width={Math.abs(a[0] - b[0])}
          height={Math.abs(a[1] - b[1])}
        />
      )}
      {kind === "circle" && (
        <ellipse
          {...common}
          cx={(a[0] + b[0]) / 2}
          cy={(a[1] + b[1]) / 2}
          rx={Math.abs(a[0] - b[0]) / 2}
          ry={Math.abs(a[1] - b[1]) / 2}
        />
      )}
      {kind === "text" && (
        <text
          x={a[0]}
          y={a[1]}
          fill={color}
          fontSize={24 + width * 2}
          fontFamily="sans-serif"
        >
          {text}
        </text>
      )}
    </g>
  );
}
