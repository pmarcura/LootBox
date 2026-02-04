"use client";

import * as React from "react";

/** Retorna offset de parallax baseado na posição do mouse/dedo (0-1) */
export function useParallax(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onMove = (e: { clientX: number; clientY: number }) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const nx = (x - 0.5) * 2;
      const ny = (y - 0.5) * 2;
      setOffset({ x: nx * 6, y: ny * 6 });
    };

    const onLeave = () => setOffset({ x: 0, y: 0 });

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [containerRef]);

  return offset;
}
