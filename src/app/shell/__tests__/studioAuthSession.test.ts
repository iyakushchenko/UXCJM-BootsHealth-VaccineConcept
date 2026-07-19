import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  installStudioAuthSessionWindowApi,
  isStudioLoggedIn,
  setStudioLoggedIn,
  subscribeStudioLoggedIn,
} from "@/app/shell/studioAuthSession";

describe("studioAuthSession", () => {
  beforeEach(() => {
    setStudioLoggedIn(false);
  });

  it("defaults logged out", () => {
    expect(isStudioLoggedIn()).toBe(false);
  });

  it("setStudioLoggedIn notifies subscribers once per change", () => {
    const listener = vi.fn();
    const unsub = subscribeStudioLoggedIn(listener);
    setStudioLoggedIn(true);
    setStudioLoggedIn(true);
    setStudioLoggedIn(false);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenNthCalledWith(1, true);
    expect(listener).toHaveBeenNthCalledWith(2, false);
    unsub();
    setStudioLoggedIn(true);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("installs __studio* / __proto* window getters and setters", () => {
    const win = {} as Window & typeof globalThis;
    vi.stubGlobal("window", win);
    const uninstall = installStudioAuthSessionWindowApi();
    expect(win.__studioIsLoggedIn?.()).toBe(false);
    expect(win.__protoIsLoggedIn?.()).toBe(false);
    expect(win.__studioSetLoggedIn?.(true)).toBe(true);
    expect(isStudioLoggedIn()).toBe(true);
    expect(win.__protoIsLoggedIn?.()).toBe(true);
    uninstall();
    expect(win.__studioIsLoggedIn).toBeUndefined();
    expect(win.__protoSetLoggedIn).toBeUndefined();
    vi.unstubAllGlobals();
  });
});
