import { useEffect, useRef, useState } from 'react';

export default function DebugOverlay() {
  const [logs, setLogs] = useState<string[]>([]);
  const [renderCount, setRenderCount] = useState(0);
  const mountTime = useRef(Date.now());

  const addLog = (msg: string) => {
    const time = ((Date.now() - mountTime.current) / 1000).toFixed(2);
    setLogs(prev => [`[${time}s] ${msg}`, ...prev].slice(0, 20));
  };

  useEffect(() => {
    // ─── Detect full page reload ───────────────────────────────────────
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navEntry?.type === 'reload') {
      addLog('🔴 PAGE WAS HARD RELOADED');
    }

    // ─── Detect form submissions that cause reload ─────────────────────
    const handleSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement;
      if (!e.defaultPrevented) {
        addLog(`🔴 UNHANDLED FORM SUBMIT → action="${form.action}" id="${form.id}" class="${form.className}"`);
        console.error('UNHANDLED FORM SUBMIT - will cause page reload!', form);
      } else {
        addLog(`✅ Form submit handled (preventDefault called)`);
      }
    };

    // ─── Detect anchor tag navigations ────────────────────────────────
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest('a');
      if (anchor) {
        const href = anchor.getAttribute('href');
        addLog(`⚠️ ANCHOR CLICKED href="${href}" target="${anchor.target}"`);
        if (!href?.startsWith('#') && !href?.startsWith('javascript') && anchor.target !== '_blank') {
          addLog(`🔴 ANCHOR MAY NAVIGATE AWAY: ${href}`);
          console.warn('Anchor navigation detected!', anchor);
        }
      }
    };

    // ─── Detect beforeunload (page leaving) ───────────────────────────
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      addLog('🔴 PAGE IS UNLOADING - beforeunload fired!');
      console.error('PAGE UNLOADING!', e);
    };

    // ─── Detect popstate (browser back/forward) ───────────────────────
    const handlePopState = () => {
      addLog('⚠️ POPSTATE fired (browser navigation)');
    };

    // ─── Detect HMR / websocket reloads (dev mode) ────────────────────
    const handleVisibilityChange = () => {
      addLog(`👁 Visibility changed → ${document.visibilityState}`);
    };

    document.addEventListener('submit', handleSubmit, true);  // capture phase
    document.addEventListener('click', handleClick, true);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    addLog('🟢 DebugOverlay mounted');

    return () => {
      document.removeEventListener('submit', handleSubmit, true);
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // ─── Count App re-renders ──────────────────────────────────────────
  useEffect(() => {
    setRenderCount(c => c + 1);
    addLog(`🔄 DebugOverlay re-render #${renderCount + 1}`);
  });

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      right: 0,
      width: '420px',
      maxHeight: '280px',
      background: '#0a0a0f',
      border: '1px solid #ff4444',
      borderRadius: '12px 0 0 0',
      zIndex: 99999,
      fontFamily: 'monospace',
      fontSize: '10px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        background: '#1a0000',
        borderBottom: '1px solid #ff4444',
        padding: '6px 10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: '#ff6666',
        fontWeight: 'bold',
        fontSize: '11px',
      }}>
        <span>🐛 DEBUG OVERLAY</span>
        <span style={{ color: '#888' }}>renders: {renderCount}</span>
      </div>

      {/* Logs */}
      <div style={{
        overflowY: 'auto',
        flex: 1,
        padding: '6px 10px',
      }}>
        {logs.length === 0 && (
          <div style={{ color: '#444' }}>Waiting for events...</div>
        )}
        {logs.map((log, i) => (
          <div key={i} style={{
            color: log.includes('🔴') ? '#ff5555'
              : log.includes('✅') ? '#55ff55'
              : log.includes('⚠️') ? '#ffaa00'
              : '#aaaaaa',
            padding: '1px 0',
            borderBottom: '1px solid #111',
          }}>
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}