import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useMuscalStore } from "@/store/useMuscalStore";
import { soundFx } from "@/lib/soundFx";

export function AudioStateManager() {
  const location = useLocation();
  const { 
    sfxEnabled, 
    akiraTheme, 
    focusMode, 
    isProcessing, 
    sessionState 
  } = useMuscalStore();

  const prevLocationRef = useRef<string>(location.pathname);
  const prevThemeRef = useRef<string>(akiraTheme);
  const prevProcessingRef = useRef<boolean>(isProcessing);

  // 1. Route transition SFX - Mechanical blip + subtle neon hum
  useEffect(() => {
    if (prevLocationRef.current !== location.pathname) {
      prevLocationRef.current = location.pathname;
      if (sfxEnabled) {
        soundFx.playModuleActivate(1);
        soundFx.playNeonHum(0.35);
      }
    }
  }, [location.pathname, sfxEnabled]);

  // 2. Theme switch acoustic resonance
  useEffect(() => {
    if (prevThemeRef.current !== akiraTheme) {
      prevThemeRef.current = akiraTheme;
      if (sfxEnabled) {
        soundFx.playThemeSwitch();
      }
    }
  }, [akiraTheme, sfxEnabled]);

  // 3. Processing state transitions (AI inference starts/stops)
  useEffect(() => {
    if (prevProcessingRef.current !== isProcessing) {
      prevProcessingRef.current = isProcessing;
      if (sfxEnabled) {
        if (isProcessing) {
          soundFx.playQuantumPulse();
        } else {
          soundFx.playSubsystemStabilized();
        }
      }
    }
  }, [isProcessing, sfxEnabled]);

  // 4. Focus mode toggle sound
  useEffect(() => {
    if (sfxEnabled && sessionState.operational) {
      soundFx.playNeonHum(0.25);
    }
  }, [focusMode, sfxEnabled, sessionState.operational]);

  return null; // Headless state manager
}
