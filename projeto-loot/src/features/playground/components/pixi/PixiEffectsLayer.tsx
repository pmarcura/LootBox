"use client";

import * as React from "react";
import { useRef } from "react";
import { Application, extend } from "@pixi/react";
import { Container, Graphics } from "pixi.js";
import { useCombatLayout } from "./useCombatLayout";
import { useParallax } from "./useParallax";
import { useScreenShake } from "./useScreenShake";

extend({ Container, Graphics });

type PixiEffectsLayerProps = {
  /** Disparar shake (ex.: ao jogar carta) */
  onShakeReady?: (trigger: (intensity?: "light" | "medium" | "heavy") => void) => void;
};

/** Camada Pixi só visual: fundo, parallax, screen shake. Sem interação. */
export function PixiEffectsLayer({ onShakeReady }: PixiEffectsLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const layout = useCombatLayout(containerRef);
  const { offset: shakeOffset, trigger: screenShake } = useScreenShake();
  const parallax = useParallax(containerRef);

  React.useEffect(() => {
    onShakeReady?.(screenShake);
    return () => onShakeReady?.(() => {});
  }, [onShakeReady, screenShake]);

  if (!layout) return null;

  const { width, height } = layout;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <Application
        background="#0c0c0e"
        resizeTo={containerRef}
        antialias
        resolution={typeof window !== "undefined" ? window.devicePixelRatio ?? 2 : 2}
      >
        <pixiContainer x={shakeOffset.x} y={shakeOffset.y} eventMode="none">
          <pixiContainer x={parallax.x * 0.5} y={parallax.y * 0.5} eventMode="none">
            <pixiGraphics
              draw={(g) => {
                g.clear();
                for (let i = 0; i < 24; i++) {
                  const x = (i % 6) * (width / 5) + 16;
                  const y = Math.floor(i / 6) * (height / 3) + 20;
                  g.circle(x, y, 2);
                  g.fill({ color: 0x3b82f6, alpha: 0.06 });
                }
              }}
            />
          </pixiContainer>
        </pixiContainer>
      </Application>
    </div>
  );
}
