import { afterEach, describe, expect, it, vi } from "vitest";
import { startBrasiliaClock, updateBrasiliaClock, updateClockVisibility } from "../src/brasilia-clock.js";

afterEach(() => vi.useRealTimers());

describe("Relógio de Brasília", () => {
  it("shows the clock only on panel routes and updates it when navigating", () => {
    const element = {};
    for (const path of ["/", "/cadastro", "/esqueci-senha", "/dashboard-publico"]) {
      updateClockVisibility(element, path);
      expect(element.hidden).toBe(true);
    }
    for (const path of ["/dashboard", "/dashboard/acesso-admin", "/dashboard/acesso-equipe", "/dashboard/servico"]) {
      updateClockVisibility(element, path);
      expect(element.hidden).toBe(false);
    }
    updateClockVisibility(element, "/");
    expect(element.hidden).toBe(true);
  });

  it("formats the real instant in Brasília, including a date rollover", () => {
    const element = {};
    updateBrasiliaClock(element, new Date("2026-11-11T02:05:06Z"));
    expect(element.textContent).toBe("10/11/2026, 23:05:06");
    expect(element.dateTime).toBe("2026-11-11T02:05:06.000Z");
  });

  it("refreshes the same element once per second", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-11T03:59:59Z"));
    const element = {};
    const timer = startBrasiliaClock(element);
    expect(element.textContent).toBe("11/11/2026, 00:59:59");
    vi.advanceTimersByTime(1000);
    expect(element.textContent).toBe("11/11/2026, 01:00:00");
    clearInterval(timer);
  });
});
