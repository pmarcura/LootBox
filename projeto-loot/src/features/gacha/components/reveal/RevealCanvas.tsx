"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { Environment } from "@react-three/drei";

type RevealCanvasProps = {
  children: React.ReactNode;
  /** Maior DPR e qualidade no modo showcase 3D */
  highQuality?: boolean;
};

function CanvasFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
    </div>
  );
}

export function RevealCanvas({ children, highQuality = false }: RevealCanvasProps) {
  return (
    <Suspense fallback={<CanvasFallback />}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        dpr={highQuality ? [1.5, 3] : [1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
        }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-5, 3, -5]} intensity={0.3} />
        <Environment preset="night" />
        {children}
      </Canvas>
    </Suspense>
  );
}
