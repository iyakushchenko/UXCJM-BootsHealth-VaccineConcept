import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { AnimatePresence, motion, MOTION_EASE_IN_OUT } from "@/uxds/motion";
import {
  beginSitePilotChatThinking,
  endSitePilotChatThinking,
  isSitePilotChatSendThinking,
  setSitePilotChatSendThinkingMode,
} from "@/projects/boots-pharmacy/dom/sitePilotChatThinking";
import { SitePilotComposer } from "../shared/SitePilotComposer";
import { CHAT_REACT_SCREEN_ID } from "./chatContract";
import {
  getChatThinkingBridgeState,
  subscribeChatThinkingBridge,
} from "./chatThinkingBridge";
import { ChatThinkingBubble } from "./ChatThinkingBubble";
import {
  CHAT_CHIP_LABELS,
  CHAT_SUGGESTED_LABEL,
  CHAT_SUGGESTED_LABEL_ID,
  CHAT_THREAD_FRAMES,
  chatChipActionId,
  chatChipSlug,
  type ChatChipLabel,
  type ChatThreadFrame,
} from "./chatThreadContent";
import "./chat.css";

/** Apply BEM once — do not set React `className` (scenario engine owns `proto-scenario-frame*`). */
function useStaticFrameClasses(
  classNames: readonly string[]
): RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    for (const name of classNames) el.classList.add(name);
  }, [classNames]);
  return ref;
}

export type ChatScreenProps = {
  onSend?: (query: string) => void;
  onChip?: (label: ChatChipLabel) => void;
  onAgentCta?: (label: string) => void;
  onProductLink?: (label: string) => void;
};

function HelpfulStrip({ conversation }: { conversation?: boolean }) {
  return (
    <div
      className="chat__helpful"
      data-name="component.gse.system.message"
      hidden={conversation ? true : undefined}
    >
      <div
        className="chat__helpful-row"
        data-name="component.input.button"
      >
        <p className="chat__helpful-prompt">
          {conversation
            ? "Was this conversation helpful so far?"
            : "Was this reply helpful?"}
        </p>
        <span className="chat__helpful-choice">Yes</span>
        <span className="chat__helpful-choice">No</span>
      </div>
    </div>
  );
}

function AgentCta({
  label,
  tone = "navy",
  onClick,
}: {
  label: string;
  tone?: "navy" | "bright";
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={`chat__cta${tone === "bright" ? " chat__cta--bright" : ""}`}
      data-name="component.input.button"
      onClick={onClick}
    >
      {label}
    </button>
  );
}

const QUERY_FRAME_CLASSES = ["chat__frame", "chat__frame--query"];

function QueryFrame({ frame }: { frame: Extract<ChatThreadFrame, { kind: "query" }> }) {
  const ref = useStaticFrameClasses(QUERY_FRAME_CLASSES);
  return (
    <motion.div
      ref={ref}
      data-name="query"
      data-studio-chat-frame={frame.id}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: MOTION_EASE_IN_OUT }}
    >
      <div
        className="chat__bubble chat__bubble--user"
        data-name="component.co.order.summary"
      >
        <div data-name="Subtotal">
          <p>{frame.text}</p>
        </div>
      </div>
    </motion.div>
  );
}

const REPLY_FRAME_CLASSES = ["chat__frame", "chat__frame--reply"];

function ReplyFrame({
  frame,
  onAgentCta,
  onProductLink,
}: {
  frame: Extract<ChatThreadFrame, { kind: "reply" }>;
  onAgentCta?: (label: string) => void;
  onProductLink?: (label: string) => void;
}) {
  const ref = useStaticFrameClasses(REPLY_FRAME_CLASSES);
  const onBodyClick = (e: MouseEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement | null;
    const link = t?.closest?.(".chat__link");
    if (!link) return;
    const label = (link.textContent ?? "").replace(/\s+/g, " ").trim();
    if (label) onProductLink?.(label);
  };

  return (
    <motion.div
      ref={ref}
      data-name="reply"
      data-studio-chat-frame={frame.id}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: MOTION_EASE_IN_OUT }}
    >
      <div
        className="chat__bubble chat__bubble--agent"
        data-name="component.co.order.summary"
      >
        {frame.thoughtLabel ? (
          <p className="chat__thought">{frame.thoughtLabel}</p>
        ) : null}
        <div data-name="Subtotal" onClick={onBodyClick}>
          {frame.body}
        </div>
        {frame.ctas.length > 0 ? (
          <div className="chat__cta-row">
            {frame.ctas.map((cta) => (
              <AgentCta
                key={cta.label}
                label={cta.label}
                tone={cta.tone}
                onClick={() => onAgentCta?.(cta.label)}
              />
            ))}
          </div>
        ) : null}
      </div>
      {frame.helpful ? <HelpfulStrip /> : null}
    </motion.div>
  );
}

function useComposerSuppressed(): boolean {
  const [suppressed, setSuppressed] = useState(() =>
    document.body.hasAttribute("data-studio-chat-composer-suppressed")
  );
  useEffect(() => {
    const sync = () =>
      setSuppressed(
        document.body.hasAttribute("data-studio-chat-composer-suppressed")
      );
    const mo = new MutationObserver(sync);
    mo.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-studio-chat-composer-suppressed"],
    });
    sync();
    return () => mo.disconnect();
  }, []);
  return suppressed;
}

export function ChatScreen({
  onSend,
  onChip,
  onAgentCta,
  onProductLink,
}: ChatScreenProps) {
  const [query, setQuery] = useState("");
  const [sendThinking, setSendThinking] = useState(false);
  const composerSuppressed = useComposerSuppressed();
  const thinking = useSyncExternalStore(
    subscribeChatThinkingBridge,
    getChatThinkingBridgeState,
    getChatThinkingBridgeState
  );

  const chips = useMemo(
    () =>
      CHAT_CHIP_LABELS.map((label) => ({
        label,
        slug: chatChipSlug(label),
        actionId: chatChipActionId(label),
      })),
    []
  );

  useEffect(() => {
    const onScenarioDeckClick = (e: Event) => {
      if (!isSitePilotChatSendThinking() && thinking.mode !== "send") return;
      const t = e.target as Element | null;
      if (!t?.closest(".studio-nav-scenario")) return;
      endSitePilotChatThinking();
      setSendThinking(false);
      const sendBtn = document.querySelector<HTMLElement>(
        '[data-studio-react-screen="chat"] .proto-agentic-send, [data-studio-react-screen="chat"] .site-pilot-composer__send'
      );
      if (sendBtn) setSitePilotChatSendThinkingMode(sendBtn, false);
    };
    document.addEventListener("click", onScenarioDeckClick, true);
    return () => document.removeEventListener("click", onScenarioDeckClick, true);
  }, [thinking.mode]);

  const handleSend = () => {
    if (sendThinking || isSitePilotChatSendThinking()) {
      endSitePilotChatThinking();
      setSendThinking(false);
      const sendBtn = document.querySelector<HTMLElement>(
        '[data-studio-react-screen="chat"] .proto-agentic-send'
      );
      if (sendBtn) setSitePilotChatSendThinkingMode(sendBtn, false);
      return;
    }

    const screen = document.querySelector(
      ".studio-viewport > div > div:nth-child(10)"
    );
    if (screen) beginSitePilotChatThinking(screen);
    setSendThinking(true);
    const sendBtn = document.querySelector<HTMLElement>(
      '[data-studio-react-screen="chat"] .proto-agentic-send'
    );
    if (sendBtn) setSitePilotChatSendThinkingMode(sendBtn, true);
    onSend?.(query);
  };

  const handleChip = (label: string) => {
    if (/^show available slots for today$/i.test(label)) {
      onChip?.(label as ChatChipLabel);
      return;
    }
    setQuery(label);
    onChip?.(label as ChatChipLabel);
  };

  const threadNodes: ReactNode[] = [];
  for (const frame of CHAT_THREAD_FRAMES) {
    if (
      thinking.mode === "playback" &&
      thinking.anchorFrameId === frame.id
    ) {
      threadNodes.push(
        <ChatThinkingBubble
          key={`think-${thinking.generation}`}
          mode="playback"
          generation={thinking.generation}
        />
      );
    }

    if (frame.kind === "query") {
      threadNodes.push(<QueryFrame key={frame.id} frame={frame} />);
    } else {
      threadNodes.push(
        <ReplyFrame
          key={frame.id}
          frame={frame}
          onAgentCta={onAgentCta}
          onProductLink={onProductLink}
        />
      );
    }

    if (
      thinking.mode === "hint" &&
      (thinking.anchorFrameId === frame.id ||
        (!thinking.anchorFrameId && frame.id === "q0"))
    ) {
      threadNodes.push(
        <ChatThinkingBubble
          key={`think-${thinking.generation}`}
          mode="hint"
          generation={thinking.generation}
        />
      );
    }
  }

  if (thinking.mode === "send") {
    threadNodes.push(
      <ChatThinkingBubble
        key={`think-${thinking.generation}`}
        mode="send"
        generation={thinking.generation}
      />
    );
  }

  return (
    <main
      className="chat"
      data-studio-react-screen={CHAT_REACT_SCREEN_ID}
      data-name="body"
      aria-label="Agentic Site Pilot chat"
    >
      <div className="chat__column">
        <div
          className="chat__summary"
          data-name="component.appointment.summary"
          aria-live="polite"
        >
          <AnimatePresence initial={false}>{threadNodes}</AnimatePresence>
          <HelpfulStrip conversation />
        </div>
      </div>

      <footer
        className="chat__composer-dock"
        aria-label="Message composer"
        hidden={composerSuppressed}
      >
        <div
          className="chat__composer-card proto-site-pilot-composer"
          data-name="component.co.order.summary"
          data-studio-chat-composer="true"
        >
          <SitePilotComposer
            surface="chat"
            query={query}
            onQueryChange={setQuery}
            onSend={handleSend}
            showSuggested
            suggestedLabel={CHAT_SUGGESTED_LABEL}
            suggestedLabelId={CHAT_SUGGESTED_LABEL_ID}
            chips={chips}
            onChip={handleChip}
            sendThinking={sendThinking || thinking.mode === "send"}
          />
        </div>
        <p className="chat__disclaimer">
          SitePilot can make mistakes.{" "}
          <span className="chat__disclaimer-link">Contact our support team</span>{" "}
          if you need further advice or fact-checking.
        </p>
      </footer>
    </main>
  );
}
