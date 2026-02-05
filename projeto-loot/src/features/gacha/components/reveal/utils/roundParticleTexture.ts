import * as THREE from "three";

const SIZE = 64;

/**
 * Cria uma textura circular suave para partículas (pontos redondos em vez de quadrados).
 * Retorna null em SSR (sem document).
 */
export function createRoundParticleTexture(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  const center = SIZE / 2;
  const radius = center - 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, radius);
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.9)");
  gradient.addColorStop(0.4, "rgba(255, 255, 255, 0.5)");
  gradient.addColorStop(0.7, "rgba(255, 255, 255, 0.15)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, SIZE, SIZE);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
