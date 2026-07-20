/**
 * When PO Messages and agent is offline — resume card for Cursor chat paste.
 */

import { peekQaAgentPresence } from "@/app/shell/agent-testing/agentTestingPresence";
import { peekPoSignal } from "@/app/shell/agent-testing/agentTestingPoSignal";
import { getSessionKind } from "@/app/shell/agent-testing/agentTestingSession";
import { readAgentTestingSitrep } from "@/app/shell/agent-testing/agentTestingSitrep";

export type QaAgentResumeCard = {
  offline: boolean;
  markdown: string;
  copyText: string;
  studioUrl: string;
};

function tipGuess(): string {
  try {
    const meta = document.querySelector('meta[name="ux-studio-version"]');
    const v = meta?.getAttribute("content");
    if (v) return v;
  } catch {
    /* hang-safe */
  }
  try {
    return (
      (window as Window & { __STUDIO_VERSION__?: string }).__STUDIO_VERSION__ ??
      "unknown"
    );
  } catch {
    return "unknown";
  }
}

/** True when no live agent heartbeat (or never linked this session). */
export function isQaAgentOfflineForMessage(): boolean {
  // peek.online already encodes linked + fresh (≤ QA_AGENT_PRESENT_MS).
  return !peekQaAgentPresence().online;
}

/**
 * Build a paste-ready Cursor resume card with hooks to get an agent up to speed.
 */
export function buildQaAgentResumeCard(pendingNote?: string): QaAgentResumeCard {
  const studioUrl =
    typeof location !== "undefined"
      ? location.href
      : "http://127.0.0.1:5173/";
  const sitrep = (() => {
    try {
      return readAgentTestingSitrep();
    } catch {
      return null;
    }
  })();
  const latch = peekPoSignal();
  const note =
    pendingNote?.trim() ||
    latch?.note?.trim() ||
    "(no pending message text)";
  const kind = getSessionKind();
  const version = tipGuess();
  const offline = isQaAgentOfflineForMessage();

  const markdown = [
    `## UX Studio — resume QA (agent was offline)`,
    ``,
    `**Studio:** ${studioUrl}`,
    `**Version / tip:** ${version}`,
    `**Session kind:** ${kind}`,
    `**Sitrep:** ${sitrep?.line ?? sitrep?.sessionLine ?? "(n/a)"}`,
    `**Pending Message:** ${note}`,
    `**Latch:** \`${latch?.code ?? "USER_MESSAGE_RECEIVED"}\``,
    ``,
    `### Agent hooks (paste in browser console on \`:5173\`)`,
    "```js",
    `// 0) Leave / return protocol (HARD)`,
    `window.__studioAgentTestingOverlay?.pauseForAgentLeave?.()`,
    `const back = window.__studioAgentTestingOverlay?.resumeForAgentReturn?.()`,
    `console.log(back?.consumedSignal?.note, back?.messagePendingWork)`,
    `// 1) Reopen QA keeping notes`,
    `window.__studioOpenQaLogger?.({ kind: "agent", oversee: true })`,
    `// 2) Read + consume PO message (also done inside resumeForAgentReturn)`,
    `window.__studioPeekPoSignal?.()`,
    `const sig = window.__studioConsumePoSignal?.()`,
    `console.log(sig?.note)`,
    `// 3) Presence / freeze / sitrep`,
    `window.__studioMcpConnectionStatus?.()`,
    `window.__studioIsQaProgressFrozen?.()`,
    `// 4) Trust gates`,
    `await window.__studioRunQaSelfTestSmoke?.()`,
    `await window.__studioRunChatBubbleMotionSelfTest?.()`,
    `// 5) Chat loading (CJM off) — watch for dump-all`,
    `// URL must keep cjm=off&screen=chat`,
    "```",
    ``,
    `### Cursor agent — do this`,
    `1. Open Studio URL above (hard-refresh).`,
    `2. Call resumeForAgentReturn() · handle Message note if messagePendingWork.`,
    `3. Reply in QA Message field so PO sees acknowledgment.`,
    `4. Prove on \`http://127.0.0.1:5173/\` only.`,
  ].join("\n");

  return {
    offline,
    markdown,
    copyText: markdown,
    studioUrl,
  };
}
