"use client";

/**
 * Tubo de transferência conectando os dois slots no topo (estética Bio-Hacker).
 */
export function TransferTube() {
  return (
    <div
      className="absolute left-0 right-0 top-0 z-0 flex justify-center"
      aria-hidden
    >
      <svg
        width="100%"
        height="32"
        viewBox="0 0 400 32"
        fill="none"
        className="text-cyan-500/80"
      >
        <defs>
          <linearGradient id="tube-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(34, 211, 238)" stopOpacity="0.9" />
            <stop offset="50%" stopColor="rgb(52, 211, 153)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="rgb(52, 211, 153)" stopOpacity="0.9" />
          </linearGradient>
          <filter id="tube-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M 40 16 L 160 16 L 200 16 L 240 16 L 360 16"
          stroke="url(#tube-gradient)"
          strokeWidth="6"
          strokeLinecap="round"
          filter="url(#tube-glow)"
        />
        <circle cx="40" cy="16" r="6" fill="rgb(34, 211, 238)" opacity="0.8" />
        <circle cx="200" cy="16" r="8" fill="rgb(34, 211, 238)" opacity="0.4" />
        <circle cx="360" cy="16" r="6" fill="rgb(52, 211, 153)" opacity="0.8" />
      </svg>
    </div>
  );
}
