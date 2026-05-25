import { useEffect } from "react";

const TRIGGER_ZONE = 150;
const MAX_SPEED = 12;

let activeCount = 0;
let rafId: number | null = null;
let cursorY = 0;

const trackCursor = (e: DragEvent) => {
  cursorY = e.clientY;
};

const tick = () => {
  const container = document.getElementById("builderPane");
  if (container) {
    const rect = container.getBoundingClientRect();
    const distFromTop = cursorY - rect.top;
    const distFromBottom = rect.bottom - cursorY;

    let speed = 0;
    let direction = 0;

    if (distFromTop >= 0 && distFromTop < TRIGGER_ZONE) {
      const intensity = (TRIGGER_ZONE - distFromTop) / TRIGGER_ZONE;
      speed = MAX_SPEED * intensity * intensity;
      direction = -1;
    } else if (distFromBottom >= 0 && distFromBottom < TRIGGER_ZONE) {
      const intensity = (TRIGGER_ZONE - distFromBottom) / TRIGGER_ZONE;
      speed = MAX_SPEED * intensity * intensity;
      direction = 1;
    }

    if (speed > 0) {
      container.scrollTop += speed * direction;
    }
  }

  rafId = requestAnimationFrame(tick);
};

const startScrollLoop = () => {
  document.addEventListener("dragover", trackCursor);
  rafId = requestAnimationFrame(tick);
};

const stopScrollLoop = () => {
  document.removeEventListener("dragover", trackCursor);
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
};

export function useAutoScroll(isDragging: boolean) {
  useEffect(() => {
    if (!isDragging) return;

    activeCount++;
    if (activeCount === 1) {
      startScrollLoop();
    }

    return () => {
      activeCount--;
      if (activeCount === 0) {
        stopScrollLoop();
      }
    };
  }, [isDragging]);
}
