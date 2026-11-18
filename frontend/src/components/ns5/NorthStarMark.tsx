export function NorthStarMark({ className }: { className?: string }) {
  return (
    <svg viewBox="-20 -20 40 40" className={className} aria-hidden="true">
      <circle r={16} className="fill-amber" opacity={0.12} />
      <path
        d="M 0 -17 L 3.2 -3.2 L 17 0 L 3.2 3.2 L 0 17 L -3.2 3.2 L -17 0 L -3.2 -3.2 Z"
        className="fill-amber"
      />
      <path
        d="M 0 -9 L 1.6 -1.6 L 9 0 L 1.6 1.6 L 0 9 L -1.6 1.6 L -9 0 L -1.6 -1.6 Z"
        className="fill-soft"
        opacity={0.85}
        transform="rotate(45)"
      />
    </svg>
  );
}
