import { describe, expect, it } from "vitest";
import {
  analyzeChatBubbleMotionSamples,
  CHAT_BUBBLE_MOTION_EXPECTED_IDS,
} from "@/app/shell/agent-testing/chatBubbleMotionSelfTest";
import type { PlaybackDiagEvent } from "@/app/shell/playbackDiag";

function sample(
  id: string,
  phase: string,
  extra?: Partial<NonNullable<PlaybackDiagEvent["bubble"]>>
): PlaybackDiagEvent {
  return {
    t: 1,
    kind: "chat-bubble-motion",
    bubble: {
      id,
      phase,
      y: extra?.y ?? 0,
      opacity: extra?.opacity ?? 1,
      deltaY: extra?.deltaY ?? 0,
      deltaTransformY: extra?.deltaTransformY ?? 0,
      shouldAnimate: true,
      jump: extra?.jump ?? false,
      ...extra,
    },
  };
}

function cleanBubble(id: string, reply: boolean): PlaybackDiagEvent[] {
  const out: PlaybackDiagEvent[] = [
    sample(id, "mount", { y: 14, opacity: 0 }),
    sample(id, "animate-start", { y: 14, opacity: 0 }),
  ];
  if (reply) out.push(sample(id, "thinking-handoff", { y: 14, opacity: 0 }));
  for (const y of [12, 8, 4, 1, 0]) {
    out.push(
      sample(id, "frame", {
        y,
        opacity: 1 - y / 14,
        deltaY: -1,
        scrollTop: 120,
        trace: {
          scrollTop: 120,
          scrollMax: 400,
          scrollLock: true,
          composerDockTop: 700,
          bubbleBottom: 650,
          clearPx: 50,
          underComposer: false,
          cameraTag: "pull-up-raf",
          deltaScrollTop: 0,
        },
      })
    );
  }
  out.push(sample(id, "animate-end", { y: 0, opacity: 1 }));
  return out;
}

describe("analyzeChatBubbleMotionSamples", () => {
  it("PASS when all 8 bubbles have clean pull-up series", () => {
    const samples = CHAT_BUBBLE_MOTION_EXPECTED_IDS.flatMap((id) =>
      cleanBubble(id, id.startsWith("r"))
    );
    const r = analyzeChatBubbleMotionSamples(samples);
    expect(r.ok).toBe(true);
    expect(r.missingIds).toEqual([]);
    expect(r.bubbles.every((b) => b.ok)).toBe(true);
    expect(r.summary.jumps).toBe(0);
  });

  it("PASS q0 entry-paint without frame series", () => {
    const samples = [
      sample("q0", "mount", { y: 14 }),
      sample("q0", "animate-start", { y: 14 }),
      ...cleanBubble("r0", true),
    ];
    const r = analyzeChatBubbleMotionSamples(samples, ["q0", "r0"]);
    expect(r.bubbles.find((b) => b.id === "q0")?.ok).toBe(true);
    expect(r.bubbles.find((b) => b.id === "q0")?.detail).toMatch(/entry-paint/);
  });

  it("FAIL on JUMP and missing thinking-handoff", () => {
    const samples = [
      ...cleanBubble("q0", false),
      sample("r0", "mount"),
      sample("r0", "animate-start"),
      sample("r0", "frame", { y: 10, deltaY: 40, jump: true }),
      sample("r0", "frame", { y: 0 }),
      sample("r0", "animate-end"),
    ];
    const r = analyzeChatBubbleMotionSamples(samples, ["q0", "r0"]);
    expect(r.ok).toBe(false);
    const r0 = r.bubbles.find((b) => b.id === "r0");
    expect(r0?.ok).toBe(false);
    expect(r0?.jumps).toBeGreaterThan(0);
    expect(r0?.hasThinkingHandoff).toBe(false);
  });

  it("FAIL on large layout movement even when co-travel owns the frame", () => {
    const samples = cleanBubble("r1", true);
    const frames = samples.filter((s) => s.bubble?.phase === "frame");
    frames[0]!.bubble!.deltaY = -4;
    frames[1]!.bubble!.deltaY = -32;
    frames[1]!.bubble!.trace = {
      ...frames[1]!.bubble!.trace,
      scrollLock: true,
      deltaScrollTop: 32,
    };

    const r = analyzeChatBubbleMotionSamples(samples, ["r1"]);
    expect(r.ok).toBe(false);
    expect(r.summary.maxAbsDeltaY).toBe(31);
    expect(r.bubbles[0]?.detail).toMatch(/layoutΔΔY=31\.0>10/);
  });

  it("PASS on smooth high-speed layout co-travel", () => {
    const samples = cleanBubble("r2", true);
    const frames = samples.filter((s) => s.bubble?.phase === "frame");
    [-22, -24, -23, -20, -16].forEach((velocity, index) => {
      frames[index]!.bubble!.deltaY = velocity;
      frames[index]!.bubble!.trace!.deltaScrollTop = -velocity;
    });
    const r = analyzeChatBubbleMotionSamples(samples, ["r2"]);
    expect(r.ok).toBe(true);
    expect(r.summary.maxAbsDeltaY).toBe(4);
  });
});
