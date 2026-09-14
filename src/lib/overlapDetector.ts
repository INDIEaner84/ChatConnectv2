/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Collision & Layout Overlap Detection Engine
 * Monitors viewport, DOM containers, and panel widths in real-time.
 * Automatically clamps, protects, or warns when elements/panels collide or overlap.
 */

export interface LayoutBounds {
  windowWidth: number;
  windowHeight: number;
  sidebarWidth: number;
  chatListWidth: number;
  minContentWidth: number;
  remainingChatWidth: number;
  isOverlapping: boolean;
  overlapAmount: number;
}

export function computeLayoutOverlap(
  windowWidth: number,
  sidebarWidth: number,
  chatListWidth: number,
  minContentWidth: number = 320
): LayoutBounds {
  const isMobile = windowWidth < 768;
  const effectiveSidebar = isMobile ? 0 : sidebarWidth;
  const effectiveChatList = isMobile ? 0 : chatListWidth;
  
  const occupiedWidth = effectiveSidebar + effectiveChatList;
  const availableForContent = windowWidth - occupiedWidth;
  
  const isOverlapping = availableForContent < minContentWidth;
  const overlapAmount = isOverlapping ? minContentWidth - availableForContent : 0;

  return {
    windowWidth,
    windowHeight: typeof window !== "undefined" ? window.innerHeight : 800,
    sidebarWidth,
    chatListWidth,
    minContentWidth,
    remainingChatWidth: Math.max(0, availableForContent),
    isOverlapping,
    overlapAmount
  };
}

/**
 * Checks if two arbitrary DOM element rectangles collide or overlap
 */
export function checkElementsOverlap(rectA: DOMRect, rectB: DOMRect): boolean {
  return !(
    rectA.right <= rectB.left ||
    rectA.left >= rectB.right ||
    rectA.bottom <= rectB.top ||
    rectA.top >= rectB.bottom
  );
}

/**
 * Calculates the safe maximum width for a panel given the current viewport
 */
export function getSafeMaxPanelWidth(
  totalWindowWidth: number,
  otherPanelsWidth: number,
  minMainContentWidth: number = 320
): number {
  return Math.max(160, totalWindowWidth - otherPanelsWidth - minMainContentWidth);
}
