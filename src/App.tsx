/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { GlobalStatusBar } from "@/components/GlobalStatusBar";
import { Chat } from "@/pages/Chat";
import { Devices } from "@/pages/Devices";
import { Trace } from "@/pages/Trace";
import { Settings } from "@/pages/Settings";
import { Agents } from "@/pages/Agents";
import { Knowledge } from "@/pages/Knowledge";
import { Models } from "@/pages/Models";
import { Voice } from "@/pages/Voice";
import { Files } from "@/pages/Files";
import { Placeholder } from "@/pages/Placeholder";
import { CognitiveMemoryOS } from "@/pages/CognitiveMemoryOS";
import { CognitiveOSHub } from "@/pages/CognitiveOSHub";
import { Diagnostics } from "@/app/ui/pages/Diagnostics";
import { TestRunnerView } from "@/app/ui/pages/TestRunnerView";
import { OfflineIndicator } from "@/app/ui/components/OfflineIndicator";
import { OverlapProtectionBanner } from "@/components/OverlapProtectionBanner";
import { SystemBootDashboard } from "@/components/SystemBootDashboard";
import { FocusModeHUD } from "@/components/FocusModeHUD";
import { CognitiveDashboard } from "@/components/CognitiveDashboard";
import { AudioStateManager } from "@/components/AudioStateManager";
import { useMuscalStore } from "@/store/useMuscalStore";

export default function App() {
  const { scanlines, isBooting } = useMuscalStore();

  return (
    <BrowserRouter>
      <AudioStateManager />
      {isBooting ? (
        <SystemBootDashboard />
      ) : (
        <div className={`flex h-screen w-full bg-[var(--bg-main)] text-[var(--text-primary)] font-sans overflow-hidden transition-colors ${scanlines ? 'akira-scanlines' : ''}`}>
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative pb-16 md:pb-0 bg-[var(--bg-main)]">
            <GlobalStatusBar />
            <FocusModeHUD />
            <OverlapProtectionBanner />
            <div className="flex-1 min-h-0 overflow-hidden relative">
              <Routes>
                <Route path="/" element={<Chat />} />
                <Route path="/dashboard" element={<CognitiveDashboard />} />
                <Route path="/cognitive-dashboard" element={<CognitiveDashboard />} />
                <Route path="/devices" element={<Devices />} />
                <Route path="/diagnostics" element={<Diagnostics />} />
                <Route path="/tests" element={<TestRunnerView />} />
                <Route path="/voice" element={<Voice />} />
                <Route path="/vision" element={<Placeholder title="Vision Interface" />} />
                <Route path="/files" element={<Files />} />
                <Route path="/cognitive-os" element={<CognitiveOSHub />} />
                <Route path="/design-lab" element={<CognitiveOSHub />} />
                <Route path="/memory" element={<CognitiveOSHub />} />
                <Route path="/knowledge" element={<Knowledge />} />
                <Route path="/models" element={<Models />} />
                <Route path="/agents" element={<Agents />} />
                <Route path="/tools" element={<Placeholder title="Tools" />} />
                <Route path="/trace" element={<Trace />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </div>
          </main>
          <MobileNav />
          <OfflineIndicator />
        </div>
      )}
    </BrowserRouter>
  );
}
