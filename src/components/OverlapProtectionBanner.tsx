import React, { useState, useEffect } from "react";
import { useMuscalStore } from "@/store/useMuscalStore";
import { computeLayoutOverlap, LayoutBounds } from "@/lib/overlapDetector";
import { soundFx } from "@/lib/soundFx";
import { ShieldAlert, RefreshCw, LayoutGrid, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function OverlapProtectionBanner() {
  const { sidebarWidth, setSidebarWidth, chatListWidth, setChatListWidth } = useMuscalStore();
  const [layoutInfo, setLayoutInfo] = useState<LayoutBounds>({
    windowWidth: typeof window !== "undefined" ? window.innerWidth : 1200,
    windowHeight: typeof window !== "undefined" ? window.innerHeight : 800,
    sidebarWidth,
    chatListWidth,
    minContentWidth: 320,
    remainingChatWidth: 600,
    isOverlapping: false,
    overlapAmount: 0
  });

  useEffect(() => {
    const checkOverlap = () => {
      if (typeof window === "undefined") return;
      const bounds = computeLayoutOverlap(window.innerWidth, sidebarWidth, chatListWidth, 340);
      setLayoutInfo(bounds);
    };

    checkOverlap();
    window.addEventListener("resize", checkOverlap);
    return () => window.removeEventListener("resize", checkOverlap);
  }, [sidebarWidth, chatListWidth]);

  const handleAutoAdjust = () => {
    soundFx.playConfirm();
    if (typeof window === "undefined") return;
    const available = window.innerWidth;
    
    // Auto-balance panels proportionally so content has at least 420px
    const safeTotal = available - 420;
    if (safeTotal > 380) {
      const newSidebar = Math.max(180, Math.min(260, Math.floor(safeTotal * 0.45)));
      const newChatList = Math.max(200, Math.min(300, Math.floor(safeTotal * 0.55)));
      setSidebarWidth(newSidebar);
      setChatListWidth(newChatList);
    } else {
      setSidebarWidth(200);
      setChatListWidth(220);
    }
  };

  return (
    <AnimatePresence>
      {layoutInfo.isOverlapping && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-12 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[calc(100%-2rem)] p-3 rounded-2xl bg-amber-500/95 text-black backdrop-blur-xl shadow-[0_12px_40px_rgba(245,158,11,0.4)] border border-amber-300 font-mono text-xs flex items-center justify-between gap-3 select-none"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 bg-black/20 rounded-xl shrink-0">
              <AlertTriangle className="w-4 h-4 text-black animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="font-extrabold tracking-tight flex items-center gap-1.5">
                <span>LAYOUT COLLISION DETECTED</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-black/20 rounded-md font-bold">
                  -{layoutInfo.overlapAmount}px Overlap
                </span>
              </div>
              <div className="text-[10px] opacity-90 truncate">
                Panel widths exceed screen area ({layoutInfo.windowWidth}px). Hauptfenster wird verdeckt!
              </div>
            </div>
          </div>

          <button
            onClick={handleAutoAdjust}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black text-amber-400 font-bold hover:bg-black/80 transition shrink-0 shadow"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>AUTO-ANPASSEN</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
