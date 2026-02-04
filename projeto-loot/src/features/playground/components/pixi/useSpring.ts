"use client";

import * as React from "react";

/** Spring physics for snap/elastic animations */
export function useSpring(
  target: number,
  options: { stiffness?: number; damping?: number; mass?: number } = {}
) {
  const { stiffness = 180, damping = 14, mass = 1 } = options;
  const [value, setValue] = React.useState(target);
  const velocityRef = React.useRef(0);

  React.useEffect(() => {
    let rafId: number;
    const tick = () => {
      const diff = target - value;
      const springForce = diff * stiffness;
      const dampForce = -velocityRef.current * damping;
      const acceleration = (springForce + dampForce) / mass;
      velocityRef.current += acceleration * 0.016;
      const next = value + velocityRef.current * 0.016;
      if (Math.abs(diff) < 0.01 && Math.abs(velocityRef.current) < 0.01) {
        setValue(target);
        velocityRef.current = 0;
        return;
      }
      setValue(next);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, value, stiffness, damping, mass]);

  return value;
}

/** 2D spring for position snap */
export function useSpring2D(
  target: { x: number; y: number },
  options: { stiffness?: number; damping?: number } = {}
) {
  const { stiffness = 200, damping = 16 } = options;
  const [pos, setPos] = React.useState(target);
  const velRef = React.useRef({ x: 0, y: 0 });

  React.useEffect(() => {
    let rafId: number;
    const tick = () => {
      const dx = target.x - pos.x;
      const dy = target.y - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 0.5 && Math.abs(velRef.current.x) < 0.5 && Math.abs(velRef.current.y) < 0.5) {
        setPos(target);
        velRef.current = { x: 0, y: 0 };
        return;
      }
      const ax = (dx * stiffness - velRef.current.x * damping) * 0.016;
      const ay = (dy * stiffness - velRef.current.y * damping) * 0.016;
      velRef.current.x += ax;
      velRef.current.y += ay;
      setPos((p) => ({
        x: p.x + velRef.current.x * 0.016,
        y: p.y + velRef.current.y * 0.016,
      }));
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, target.x, target.y, pos.x, pos.y, stiffness, damping]);

  return pos;
}
