"use client";

import { useSpring, type SpringValue } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import type { ReactNode } from "react";

type UseDragWithSpringOptions = {
  /** Haptic ao iniciar arraste (mobile). */
  hapticOnStart?: boolean;
  /** Haptic ao soltar (drop). */
  hapticOnEnd?: boolean;
  /** Se true, ao soltar o spring volta para (0,0). Se false, mantém posição. */
  resetOnRelease?: boolean;
  /** Limite de movimento em px [x, y]. */
  bounds?: { left?: number; right?: number; top?: number; bottom?: number };
  /** Chamado ao soltar o arraste, com a posição do ponteiro (para hit-test de drop zone). */
  onDragEnd?: (clientX: number, clientY: number) => void;
  /** Chamado quando o estado de arraste muda (para z-index durante drag). */
  onDraggingChange?: (isDragging: boolean) => void;
};

/**
 * Arraste orgânico com spring (use-gesture + react-spring).
 * Use com animated.div e spread ...bind() no elemento.
 * Ex.: const { style, bind } = useDragWithSpring({ hapticOnStart: true });
 *      <animated.div {...bind()} style={style}>...</animated.div>
 */
export function useDragWithSpring(options: UseDragWithSpringOptions = {}) {
  const {
    hapticOnStart = true,
    hapticOnEnd = false,
    resetOnRelease = true,
    bounds,
    onDragEnd,
    onDraggingChange,
  } = options;

  const [{ x, y }, api] = useSpring(() => ({ x: 0, y: 0 }));

  const bind = useDrag(
    ({ down, movement: [mx, my], first, last, event }) => {
      if (first) onDraggingChange?.(down);
      if (last) onDraggingChange?.(false);
      if (first && hapticOnStart && typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(50);
      }
      if (last && hapticOnEnd && typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(30);
      }
      if (last && onDragEnd && event && "clientX" in event && "clientY" in event) {
        onDragEnd(event.clientX, event.clientY);
      }
      api.start({
        x: down ? mx : resetOnRelease ? 0 : mx,
        y: down ? my : resetOnRelease ? 0 : my,
        immediate: down,
      });
    },
    {
      bounds,
      pointer: { touch: true, mouse: true },
      axis: undefined,
      rubberband: true,
    },
  );

  const style = { x, y } as { x: SpringValue<number>; y: SpringValue<number> };
  return { style, bind };
}

export type UseDragWithSpringReturn = ReturnType<typeof useDragWithSpring>;
