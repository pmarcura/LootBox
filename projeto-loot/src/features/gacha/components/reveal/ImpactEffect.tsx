"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type ImpactEffectProps = {
  trigger: number; // incrementa para disparar efeito
  color: string;
  intensity?: number; // 0-1, para interpolar cor
};

type Impact = {
  id: number;
  startTime: number;
  colorIntensity: number; // salva a intensidade no momento do impacto
};

const IMPACT_DURATION = 350; // ms
const NEUTRAL_COLOR = "#ffffff";

/**
 * Efeito de onda de choque + flash quando clica no cubo.
 * A cor começa neutra e revela gradualmente a cor da raridade.
 */
export function ImpactEffect({ trigger, color, intensity = 0 }: ImpactEffectProps) {
  const [impacts, setImpacts] = useState<Impact[]>([]);
  const meshRefs = useRef<Map<number, THREE.Mesh>>(new Map());
  const flashRefs = useRef<Map<number, THREE.Mesh>>(new Map());

  // Cores para interpolação
  const neutralColor = useMemo(() => new THREE.Color(NEUTRAL_COLOR), []);
  const rarityColor = useMemo(() => new THREE.Color(color), [color]);

  // Cria novo impacto quando trigger muda
  useEffect(() => {
    if (trigger > 0) {
      const newImpact: Impact = {
        id: Date.now(),
        startTime: Date.now(),
        colorIntensity: intensity, // captura a intensidade atual
      };
      setImpacts((prev) => [...prev.slice(-3), newImpact]); // mantém máx 4 impactos
    }
  }, [trigger, intensity]);

  // Limpa impactos antigos
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setImpacts((prev) =>
        prev.filter((impact) => now - impact.startTime < IMPACT_DURATION)
      );
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useFrame(() => {
    const now = Date.now();

    impacts.forEach((impact) => {
      const mesh = meshRefs.current.get(impact.id);
      const flash = flashRefs.current.get(impact.id);
      if (!mesh) return;

      const elapsed = now - impact.startTime;
      const progress = Math.min(elapsed / IMPACT_DURATION, 1);

      // Escala expande rapidamente
      const scale = 0.3 + progress * 3;
      mesh.scale.set(scale, scale, scale);

      // Interpola cor baseado na intensidade do impacto
      const currentColor = neutralColor.clone().lerp(rarityColor, impact.colorIntensity);

      // Opacidade diminui
      const material = mesh.material as THREE.MeshBasicMaterial;
      material.opacity = (1 - progress) * 0.7;
      material.color.copy(currentColor);

      // Flash central
      if (flash) {
        const flashMaterial = flash.material as THREE.MeshBasicMaterial;
        flashMaterial.opacity = Math.max(0, 1 - progress * 3);
      }
    });
  });

  if (impacts.length === 0) return null;

  return (
    <group>
      {impacts.map((impact) => (
        <group key={impact.id}>
          {/* Onda de choque circular */}
          <mesh
            ref={(ref) => {
              if (ref) meshRefs.current.set(impact.id, ref);
              else meshRefs.current.delete(impact.id);
            }}
          >
            <ringGeometry args={[0.6, 0.8, 32]} />
            <meshBasicMaterial
              color={NEUTRAL_COLOR}
              transparent
              opacity={0.7}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>

          {/* Flash central */}
          <mesh
            ref={(ref) => {
              if (ref) flashRefs.current.set(impact.id, ref);
              else flashRefs.current.delete(impact.id);
            }}
            scale={0.4}
          >
            <sphereGeometry args={[1, 12, 12]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={1}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
