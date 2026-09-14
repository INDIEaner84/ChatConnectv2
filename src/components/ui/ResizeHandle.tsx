/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Interactive Draggable Edge / Border Resize Component with SFX feedback
 */

import React, { useState, useEffect, useRef } from "react";
import { soundFx } from "@/lib/soundFx";

interface ResizeHandleProps {
  orientation?: "vertical" | "horizontal";
  onResize: (delta: number, currentWidthOrHeight: number) => void;
  onResizeEnd?: () => void;
  className?: string;
  id?: string;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  orientation = "vertical",
  onResize,
  onResizeEnd,
  className = "",
  id = "edge-resize-handle"
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startPosRef = useRef<number>(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    startPosRef.current = orientation === "vertical" ? e.clientX : e.clientY;
    soundFx.playClick();
    document.body.style.userSelect = "none";
    document.body.style.cursor = orientation === "vertical" ? "col-resize" : "row-resize";
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    startPosRef.current = orientation === "vertical" ? e.touches[0].clientX : e.touches[0].clientY;
    soundFx.playClick();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const currentPos = orientation === "vertical" ? e.clientX : e.clientY;
      const delta = currentPos - startPosRef.current;
      startPosRef.current = currentPos;
      
      onResize(delta, currentPos);
      soundFx.playResizeTick();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const currentPos = orientation === "vertical" ? e.touches[0].clientX : e.touches[0].clientY;
      const delta = currentPos - startPosRef.current;
      startPosRef.current = currentPos;
      
      onResize(delta, currentPos);
      soundFx.playResizeTick();
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      soundFx.playBeep(920, 0.04, "sine");
      onResizeEnd?.();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDragging, orientation, onResize, onResizeEnd]);

  const isVertical = orientation === "vertical";

  return (
    <div
      id={id}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      title="Drag edge to resize panel (Ziehen zum Anpassen der Breite)"
      className={`group relative z-30 transition-all duration-150 select-none ${
        isVertical
          ? "w-2.5 -mx-1.5 cursor-col-resize h-full flex items-center justify-center"
          : "h-2.5 -my-1.5 cursor-row-resize w-full flex items-center justify-center"
      } ${className}`}
    >
      {/* Visual Divider line */}
      <div
        className={`transition-all duration-200 rounded-full ${
          isVertical ? "w-[2px] h-full" : "h-[2px] w-full"
        } ${
          isDragging
            ? "bg-[var(--accent-neon)] shadow-[0_0_12px_var(--accent-neon)] opacity-100 scale-x-125"
            : "bg-[var(--border-color)]/70 group-hover:bg-[var(--accent-neon)]/80 group-hover:shadow-[0_0_8px_var(--accent-neon)]"
        }`}
      />

      {/* Futuristic Akira HUD Center Grip Pill */}
      <div
        className={`absolute rounded-full transition-all duration-200 flex items-center justify-center ${
          isVertical
            ? "w-3 h-10 -translate-x-1/2 left-1/2"
            : "h-3 w-10 -translate-y-1/2 top-1/2"
        } ${
          isDragging
            ? "bg-[var(--accent-neon)] text-black scale-110 shadow-[0_0_14px_var(--accent-neon)]"
            : "bg-[var(--bg-card)] border border-[var(--border-color)] group-hover:border-[var(--accent-neon)] group-hover:bg-[var(--bg-sidebar)] opacity-0 group-hover:opacity-100"
        }`}
      >
        <div className={`flex gap-0.5 ${isVertical ? "flex-col" : "flex-row"}`}>
          <span className="w-1 h-1 rounded-full bg-current opacity-75" />
          <span className="w-1 h-1 rounded-full bg-current opacity-75" />
          <span className="w-1 h-1 rounded-full bg-current opacity-75" />
        </div>
      </div>
    </div>
  );
};
