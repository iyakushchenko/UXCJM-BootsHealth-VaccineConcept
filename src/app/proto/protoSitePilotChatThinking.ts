import { scrollPrototypeScrollToBottom } from "@/app/proto/protoScenarioEngine";

const THINKING_ATTR = "data-proto-chat-thinking";
const THINKING_CLASS = "proto-chat-thinking-bubble";

const STOP_GLYPH_HTML = `<svg class="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="3" width="10" height="10" rx="1.5" fill="#ffffff"/></svg>`;

export type SitePilotChatThinkingMode = "none" | "hint" | "playback" | "send";

let thinkingMode: SitePilotChatThinkingMode = "none";

function resolveSummary(screenOrSummary: ParentNode): HTMLElement | null {
  if (
    screenOrSummary instanceof HTMLElement &&
    screenOrSummary.matches('[data-name="component.appointment.summary"]')
  ) {
    return screenOrSummary;
  }
  return screenOrSummary.querySelector<HTMLElement>(
    '[data-name="component.appointment.summary"]'
  );
}

function ensureThinkingBubble(summary: HTMLElement): HTMLElement {
  let bubble = summary.querySelector<HTMLElement>(`[${THINKING_ATTR}]`);
  if (bubble) return bubble;

  bubble = document.createElement("div");
  bubble.setAttribute(THINKING_ATTR, "true");
  bubble.className = THINKING_CLASS;
  bubble.hidden = true;
  bubble.setAttribute("role", "status");
  bubble.setAttribute("aria-live", "polite");
  bubble.innerHTML = `
    <div class="proto-chat-thinking-bubble__inner">
      <span class="proto-chat-thinking-dots" aria-hidden="true">
        <span></span><span></span><span></span>
      </span>
      <span class="proto-chat-thinking-bubble__sr">SitePilot is thinking</span>
    </div>
  `.trim();

  const composer = summary.querySelector<HTMLElement>(
    '[data-proto-chat-composer="true"]'
  );
  if (composer) {
    summary.insertBefore(bubble, composer);
  } else {
    summary.appendChild(bubble);
  }

  return bubble;
}

function scrollChatToBottom(): void {
  const scrollEl = document.querySelector<HTMLElement>(
    ".proto-scroll--prototype:not(.hidden)"
  );
  scrollPrototypeScrollToBottom(scrollEl, "smooth");
  window.setTimeout(
    () => scrollPrototypeScrollToBottom(scrollEl, "instant"),
    360
  );
}

function restartThinkingAnimation(bubble: HTMLElement): void {
  bubble.classList.remove("proto-chat-thinking-bubble--reveal");
  void bubble.offsetWidth;
  bubble.classList.add("proto-chat-thinking-bubble--reveal");

  const dots = bubble.querySelector<HTMLElement>(".proto-chat-thinking-dots");
  if (dots) {
    dots.classList.remove("proto-chat-thinking-dots--run");
    void dots.offsetWidth;
    dots.classList.add("proto-chat-thinking-dots--run");
  }
}

function showThinkingBubble(
  summary: HTMLElement,
  mode: Exclude<SitePilotChatThinkingMode, "none">,
  scroll: boolean
): void {
  thinkingMode = mode;
  const bubble = ensureThinkingBubble(summary);
  bubble.hidden = false;
  bubble.classList.toggle("proto-chat-thinking-bubble--hint", mode === "hint" || mode === "playback");
  restartThinkingAnimation(bubble);
  if (scroll) scrollChatToBottom();
}

export function isSitePilotChatThinking(): boolean {
  return thinkingMode !== "none";
}

export function isSitePilotChatSendThinking(): boolean {
  return thinkingMode === "send";
}

export function isSitePilotChatHintThinking(): boolean {
  return thinkingMode === "hint";
}

export function isSitePilotChatPlaybackThinking(): boolean {
  return thinkingMode === "playback";
}

/** Ambient hint on frame 1 — indicates the chat is live. */
export function syncSitePilotChatThinkingHint(
  screenOrSummary: ParentNode | null,
  show: boolean
): void {
  if (!show) {
    if (thinkingMode === "hint") endSitePilotChatThinking();
    return;
  }
  if (thinkingMode === "send" || thinkingMode === "playback") return;

  const summary = screenOrSummary ? resolveSummary(screenOrSummary) : null;
  if (!summary) return;

  showThinkingBubble(summary, "hint", false);
}

export function beginSitePilotChatThinking(screenOrSummary: ParentNode): void {
  const summary = resolveSummary(screenOrSummary);
  if (!summary || thinkingMode === "send") return;

  showThinkingBubble(summary, "send", true);
}

/** Pre-reveal pause while scenario play advances onto an agent reply. */
export function beginSitePilotChatPlaybackThinking(
  screenOrSummary: ParentNode
): void {
  const summary = resolveSummary(screenOrSummary);
  if (!summary) return;
  if (thinkingMode === "send") return;

  showThinkingBubble(summary, "playback", true);
}

export function endSitePilotChatThinking(): void {
  thinkingMode = "none";
  document.querySelectorAll<HTMLElement>(`[${THINKING_ATTR}]`).forEach((bubble) => {
    bubble.hidden = true;
    bubble.classList.remove(
      "proto-chat-thinking-bubble--reveal",
      "proto-chat-thinking-bubble--hint"
    );
    bubble
      .querySelector(".proto-chat-thinking-dots")
      ?.classList.remove("proto-chat-thinking-dots--run");
  });
}

export function setSitePilotChatSendThinkingMode(
  sendBtn: HTMLElement,
  thinking: boolean
): void {
  sendBtn.classList.toggle("proto-agentic-send--stop", thinking);
  sendBtn.setAttribute("aria-label", thinking ? "Stop" : "Send message");

  const glyphHost = sendBtn.querySelector<HTMLElement>('[data-name="glyph"]');
  if (!glyphHost) return;

  if (thinking) {
    if (!sendBtn.dataset.protoSendGlyphHtml) {
      sendBtn.dataset.protoSendGlyphHtml = glyphHost.innerHTML;
    }
    glyphHost.innerHTML = STOP_GLYPH_HTML;
    return;
  }

  if (sendBtn.dataset.protoSendGlyphHtml) {
    glyphHost.innerHTML = sendBtn.dataset.protoSendGlyphHtml;
    delete sendBtn.dataset.protoSendGlyphHtml;
  }
  glyphHost.querySelectorAll("path").forEach((path) => {
    path.setAttribute("fill", "#ffffff");
  });
}
