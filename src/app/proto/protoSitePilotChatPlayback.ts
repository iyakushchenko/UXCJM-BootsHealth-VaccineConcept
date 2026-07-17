import { scrollPrototypeScrollToBottom } from "@/app/proto/protoScenarioEngine";
import {
  beginSitePilotChatPlaybackThinking,
  endSitePilotChatThinking,
} from "@/app/proto/protoSitePilotChatThinking";
import {
  findSitePilotChatComposerCard,
  isSitePilotChatAgentReplyFrame,
  SITE_PILOT_CHAT_PLAYBACK_THINK_MS,
} from "@/app/proto/protoSitePilotChatScenario";
import type { BeforeRevealContext } from "@/app/nav/useProtoScenarioPlayback";

const AGENTIC_QUERY_LINE_PX = 24;
const AGENTIC_QUERY_MAX_LINES = 5;

const TYPING_MS_PER_CHAR = 26;
const TYPING_MS_JITTER = 14;
const SEND_PAUSE_MS = 420;
const CTA_TRAVEL_MS = 520;
const CTA_PRESS_MS = 280;

/** Which agent CTA Sarah clicks before each scripted user reply. */
const CTA_BEFORE_USER_FRAME: Record<number, RegExp> = {
  5: /check availability slot for me/i,
  7: /find available slots for today/i,
};

const CURSOR_SVG = `<svg class="block size-full" fill="none" viewBox="0 0 22 26" aria-hidden="true"><path fill="#fff" stroke="#4F4F4F" stroke-width="0.6" d="M3.5 2.5 18.5 12 10.5 14.5 12.5 22.5 9.5 23.5 7.5 15.5 3.5 17.5z"/></svg>`;

let preludeAborted = false;

export function abortSitePilotChatPlaybackPrelude(): void {
  preludeAborted = true;
  removeDemoCursor();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getChatScreen(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    ".proto-viewport > div > div:nth-child(10)"
  );
}

function scrollChatToBottom(): void {
  const scrollEl = document.querySelector<HTMLElement>(
    ".proto-scroll--prototype:not(.hidden)"
  );
  scrollPrototypeScrollToBottom(scrollEl, "smooth");
}

function syncComposerHeight(ta: HTMLTextAreaElement): void {
  const max = AGENTIC_QUERY_LINE_PX * AGENTIC_QUERY_MAX_LINES;
  ta.style.setProperty("height", "0px", "important");
  ta.style.setProperty("min-height", "0px", "important");
  const next = Math.min(
    Math.max(ta.scrollHeight, AGENTIC_QUERY_LINE_PX),
    max
  );
  ta.style.setProperty("min-height", `${AGENTIC_QUERY_LINE_PX}px`, "important");
  ta.style.setProperty("height", `${next}px`, "important");
  ta.style.setProperty(
    "overflow-y",
    next >= max ? "auto" : "hidden",
    "important"
  );
}

export function stripSitePilotChatDemoCursors(root: ParentNode = document): void {
  getChatScreen()?.querySelectorAll('[data-name=".utility / cursor"]').forEach((el) => {
    el.remove();
  });
}

export function isSitePilotChatUserQueryFrame(frame: HTMLElement): boolean {
  return frame.matches('[data-name="query"]');
}

export function extractSitePilotChatUserMessageText(
  frame: HTMLElement
): string | null {
  if (!isSitePilotChatUserQueryFrame(frame)) return null;
  const subtotal = frame.querySelector<HTMLElement>('[data-name="Subtotal"]');
  const text = subtotal?.textContent?.replace(/\s+/g, " ").trim() ?? "";
  return text || null;
}

function findCtaInAgentFrame(
  agentFrame: HTMLElement,
  pattern: RegExp
): HTMLElement | null {
  return (
    Array.from(
      agentFrame.querySelectorAll<HTMLElement>(
        '[data-name="component.input.button"]'
      )
    ).find((btn) => pattern.test(btn.textContent ?? "")) ?? null
  );
}

function removeDemoCursor(): void {
  document
    .querySelectorAll<HTMLElement>(".proto-chat-demo-cursor")
    .forEach((el) => el.remove());
}

async function moveDemoCursorTo(target: HTMLElement): Promise<void> {
  removeDemoCursor();
  const cursor = document.createElement("div");
  cursor.className = "proto-chat-demo-cursor";
  cursor.innerHTML = CURSOR_SVG;
  document.body.appendChild(cursor);

  const rect = target.getBoundingClientRect();
  const endX = rect.left + rect.width * 0.72;
  const endY = rect.top + rect.height * 0.55;
  const startX = endX + 72;
  const startY = endY + 48;

  cursor.style.left = `${startX}px`;
  cursor.style.top = `${startY}px`;

  await delay(40);
  cursor.style.left = `${endX}px`;
  cursor.style.top = `${endY}px`;
  await delay(CTA_TRAVEL_MS);
}

async function simulateSarahCtaClick(button: HTMLElement): Promise<void> {
  if (preludeAborted) return;

  button.scrollIntoView({ block: "nearest", behavior: "smooth" });
  await delay(180);
  if (preludeAborted) return;

  await moveDemoCursorTo(button);
  if (preludeAborted) return;

  button.classList.add("proto-chat-cta--pressed");
  await delay(CTA_PRESS_MS);
  button.classList.remove("proto-chat-cta--pressed");
  removeDemoCursor();
  await delay(160);
}

async function pulseComposerSend(): Promise<void> {
  const card = findSitePilotChatComposerCard();
  const sendBtn = card?.querySelector<HTMLElement>(".proto-agentic-send");
  if (!sendBtn) return;
  sendBtn.classList.add("proto-agentic-send--sending");
  await delay(SEND_PAUSE_MS);
  sendBtn.classList.remove("proto-agentic-send--sending");
}

async function simulateSarahCtaSend(): Promise<void> {
  scrollChatToBottom();
  await delay(220);
}

export async function simulateSarahTypingInComposer(text: string): Promise<void> {
  const card = findSitePilotChatComposerCard();
  const ta = card?.querySelector<HTMLTextAreaElement>("textarea.proto-agentic-query");
  if (!ta) {
    await delay(700);
    return;
  }

  ta.value = "";
  syncComposerHeight(ta);
  ta.focus();
  scrollChatToBottom();

  for (let i = 0; i < text.length; i++) {
    if (preludeAborted) {
      ta.value = "";
      syncComposerHeight(ta);
      return;
    }
    ta.value = text.slice(0, i + 1);
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    syncComposerHeight(ta);
    if (i % 8 === 0) scrollChatToBottom();
    await delay(TYPING_MS_PER_CHAR + Math.random() * TYPING_MS_JITTER);
  }

  if (preludeAborted) {
    ta.value = "";
    syncComposerHeight(ta);
    return;
  }

  await pulseComposerSend();
  ta.value = "";
  ta.dispatchEvent(new Event("input", { bubbles: true }));
  syncComposerHeight(ta);
}

export async function runSitePilotChatBeforeReveal(
  ctx: BeforeRevealContext
): Promise<void> {
  preludeAborted = false;
  const { frame, frameIndex, frames, currentCount } = ctx;

  if (isSitePilotChatAgentReplyFrame(frame)) {
    const screen = getChatScreen();
    if (screen) beginSitePilotChatPlaybackThinking(screen);
    scrollChatToBottom();
    await delay(SITE_PILOT_CHAT_PLAYBACK_THINK_MS);
    if (!preludeAborted) endSitePilotChatThinking();
    return;
  }

  if (!isSitePilotChatUserQueryFrame(frame) || frameIndex <= 1) return;

  const ctaPattern = CTA_BEFORE_USER_FRAME[frameIndex];
  let sentViaCta = false;
  if (ctaPattern) {
    const agentFrame = frames[currentCount - 1];
    if (agentFrame && isSitePilotChatAgentReplyFrame(agentFrame)) {
      const button = findCtaInAgentFrame(agentFrame, ctaPattern);
      if (button) {
        await simulateSarahCtaClick(button);
        sentViaCta = true;
      }
    }
  }

  const text = extractSitePilotChatUserMessageText(frame);
  if (!text) return;

  if (sentViaCta) {
    await simulateSarahCtaSend();
  } else {
    await simulateSarahTypingInComposer(text);
  }
}
