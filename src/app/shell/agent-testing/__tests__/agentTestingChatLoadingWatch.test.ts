/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  armQaChatLoadingWatch,
  disarmQaChatLoadingWatch,
  isQaChatLoadingDumpWatchApplicable,
  resetQaChatLoadingWatchForTests,
  tickQaChatLoadingWatchForTests,
} from "@/app/shell/agent-testing/agentTestingChatLoadingWatch";
import {
  clearChatScenarioReveal,
  publishChatScenarioReveal,
} from "@/projects/boots-pharmacy/screens/chat/chatScenarioRevealBridge";

function setSearch(search: string): void {
  const q = search.startsWith("?") ? search : `?${search}`;
  window.history.replaceState(null, "", `/${q}`);
}

describe("agentTestingChatLoadingWatch", () => {
  beforeEach(() => {
    resetQaChatLoadingWatchForTests();
    clearChatScenarioReveal();
    setSearch(
      "?project=boots-pharmacy&screen=chat&cjm=off&experience=agentic&persona=sarah-jenkins"
    );
  });

  afterEach(() => {
    resetQaChatLoadingWatchForTests();
    clearChatScenarioReveal();
    vi.restoreAllMocks();
  });

  it("applies only when cjm=off", () => {
    expect(isQaChatLoadingDumpWatchApplicable("?cjm=off&screen=chat")).toBe(
      true
    );
    expect(isQaChatLoadingDumpWatchApplicable("?cjm=on&screen=chat")).toBe(
      false
    );
    expect(isQaChatLoadingDumpWatchApplicable("?screen=chat")).toBe(false);
  });

  it("CJM-off: FAIL when ≥4 frames paint before content-load interim", () => {
    const onFail = vi.fn();
    const t0 = performance.now();
    vi.spyOn(performance, "now").mockImplementation(() => t0);
    publishChatScenarioReveal({ active: false, visibleCount: 0 });
    armQaChatLoadingWatch({ onFail });
    publishChatScenarioReveal({ active: false, visibleCount: 8 });
    tickQaChatLoadingWatchForTests();
    expect(onFail).toHaveBeenCalledTimes(1);
    expect(String(onFail.mock.calls[0]?.[0])).toMatch(/CHAT_LOADING_DUMP_ALL/);
  });

  it("CJM-on: does not arm / does not FAIL progressive fast reveal", () => {
    setSearch(
      "?project=boots-pharmacy&screen=chat&cjm=on&experience=agentic&persona=sarah-jenkins"
    );
    const onFail = vi.fn();
    publishChatScenarioReveal({ active: true, visibleCount: 1 });
    armQaChatLoadingWatch({ onFail });
    publishChatScenarioReveal({ active: true, visibleCount: 8 });
    tickQaChatLoadingWatchForTests();
    expect(onFail).not.toHaveBeenCalled();
  });

  it("CJM-off: no FAIL while interim holds empty then paints after budget", () => {
    const onFail = vi.fn();
    const t0 = performance.now();
    vi.spyOn(performance, "now").mockImplementation(() => t0);
    publishChatScenarioReveal({ active: false, visibleCount: 0 });
    armQaChatLoadingWatch({ onFail });
    tickQaChatLoadingWatchForTests();
    expect(onFail).not.toHaveBeenCalled();
    // Past BATCH_FAIL_MS — full paint after interim window is OK for this watch.
    vi.spyOn(performance, "now").mockImplementation(() => t0 + 600);
    publishChatScenarioReveal({ active: false, visibleCount: 8 });
    tickQaChatLoadingWatchForTests();
    expect(onFail).not.toHaveBeenCalled();
  });

  it("disarm stops further fails", () => {
    const onFail = vi.fn();
    armQaChatLoadingWatch({ onFail });
    disarmQaChatLoadingWatch();
    publishChatScenarioReveal({ active: false, visibleCount: 8 });
    tickQaChatLoadingWatchForTests();
    expect(onFail).not.toHaveBeenCalled();
  });
});
