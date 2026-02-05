"use client";

import { useRef, useState, useCallback } from "react";

type CardParallaxProps = {
  children: React.ReactNode;
  className?: string;
  /** Intensidade do movimento (px). Default 12 */
  intensity?: number;
};

/**
 * Wrapper que aplica efeito parallax 3D ao passar o mouse: a área de conteúdo
 * desloca-se ligeiramente na direção oposta ao cursor, simulando profundidade.
 */
export function CardParallax({
  children,
  className = "",
  intensity = 12,
}: CardParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const x = (e.clientX - centerX) / rect.width;
      const y = (e.clientY - centerY) / rect.height;
      setTransform({
        x: x * intensity,
        y: y * intensity,
      });
    },
    [intensity],
  );

  const handleMouseLeave = useCallback(() => {
    setTransform({ x: 0, y: 0 });
  }, []);

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="h-full w-full transition-transform duration-150 ease-out will-change-transform"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(1.02)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
