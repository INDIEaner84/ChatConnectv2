import React, { useEffect, useState } from 'react';
import { runAllTestGates, TestSuiteSummary, TestResultItem } from '@/tests/testRunner';
import { CheckCircle2, XCircle, Play, Shield, RefreshCw, Layers } from 'lucide-react';

export const TestRunnerView: React.FC = () => {
  const [summary, setSummary] = useState<TestSuiteSummary | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<string>('all');

  const executeTests = async () => {
    setIsRunning(true);
    try {
      const res = await runAllTestGates();
      setSummary(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    executeTests();
  }, []);

  const phases = [
    'all',
    'Phase 1: Foundation',
    'Phase 2: Identity',
    'Phase 3: QR Invitation',
    'Phase 4: Messenger Core',
    'Phase 5: Extension Architecture',
    'Chaos & Resilience',
  ];

  const filteredResults = summary
    ? selectedPhase === 'all'
      ? summary.results
      : summary.results.filter((r) => r.phase === selectedPhase)
    : [];

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-emerald-500" />
            Verification & Quality Test Gates
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Automated compliance gates for Foundation, Identity, QR, Messenger Core, and Chaos Resilience.
          </p>
        </div>
        <button
          onClick={executeTests}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow transition"
        >
          {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          <span>{isRunning ? 'Running Gates...' : 'Run All Test Gates'}</span>
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm text-center">
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-mono">{summary.total}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total Test Gates</div>
          </div>
          <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm text-center">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">{summary.passed}</div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">Passed Gates</div>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm text-center">
            <div className="text-2xl font-bold text-red-500 font-mono">{summary.failed}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Failed Gates</div>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm text-center">
            <div className="text-2xl font-bold text-sky-600 dark:text-sky-400 font-mono">{summary.durationMs}ms</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Gate Execution Time</div>
          </div>
        </div>
      )}

      {/* Phase Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {phases.map((phase) => (
          <button
            key={phase}
            onClick={() => setSelectedPhase(phase)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition ${
              selectedPhase === phase
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {phase === 'all' ? 'All Phases' : phase}
          </button>
        ))}
      </div>

      {/* Test List */}
      <div className="space-y-3">
        {filteredResults.map((test, index) => (
          <div
            key={index}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm flex items-start gap-3.5 transition"
          >
            {test.passed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{test.name}</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {test.phase}
                </span>
              </div>
              {test.message && (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{test.message}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
