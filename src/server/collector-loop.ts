import { runCollectors } from "@/server/collector";

const globalLoop = globalThis as unknown as { psxCollector?: boolean };

export function startCollectorLoop() {
  if (globalLoop.psxCollector) return;
  globalLoop.psxCollector = true;
  const tick = async () => {
    try {
      await runCollectors(false);
    } catch (error) {
      console.error("[collector]", error instanceof Error ? error.message : error);
    }
  };
  setTimeout(tick, 15000);
  setInterval(tick, 3 * 60 * 1000);
}
