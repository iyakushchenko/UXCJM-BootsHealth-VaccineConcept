/**
 * Lightweight MCP smoke guide — run in Chrome DevTools MCP against npm run dev.
 *
 * 1. navigate_page → http://localhost:5173 (or active Vite port)
 * 2. evaluate_script → window.__protoEnsureCleanStudio?.()
 * 3. evaluate_script → window.__protoSmokeRetreatChecks?.()
 * 4. evaluate_script → window.__protoSetOrchestraMode?.('traditional-cjm')
 * 5. click role=switch name="Journey mode" (ProtoStudioJourneySwitch — not Orchestra mode)
 * 6. Play / step-back retreat baselines — counter should stay at chat end (e.g. 25/25 not 2/25)
 * 7. Agentic avail-continue step-back — calendar shows June 25 (not 21/24)
 *
 * Pass criteria: __protoSmokeRetreatChecks().pass === true
 */

console.log(`
Proto smoke (MCP):
  window.__protoEnsureCleanStudio?.()
  window.__protoSmokeRetreatChecks?.()
  window.__protoSetOrchestraMode?.('agentic-cjm' | 'traditional-cjm')
  window.__protoStudioState?.()
`);
