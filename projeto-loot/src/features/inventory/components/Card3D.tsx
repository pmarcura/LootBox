"use client";

import { useRef, useState, useCallback } from "react";

type Card3DProps = {
  children: React.ReactNode;
  className?: string;
  /** Intensidade da rotação em graus. Default 8 */
  maxTilt?: number;
};

/**
 * Envolve a carta inteira e aplica inclinação 3D (rotateX/rotateY) ao passar o mouse,
 * dando sensação de que a carta é um objeto físico.
 */
export function Card3D({
  children,
  className = "",
  maxTilt = 8,
}: Card3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0 });

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
        rotateY: x * maxTilt,
        rotateX: -y * maxTilt,
      });
    },
    [maxTilt],
  );

  const handleMouseLeave = useCallback(() => {
    setTransform({ rotateX: 0, rotateY: 0 });
  }, []);

  return (
    <div
      ref={ref}
      className={`perspective-[1000px] ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="transition-transform duration-150 ease-out will-change-transform"
        style={{
          transform: `rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
