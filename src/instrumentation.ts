export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.npm_lifecycle_event === "build") return;
  if (process.env.ENABLE_COLLECTOR !== "true") return;
  const { startCollectorLoop } = await import("@/server/collector-loop");
  startCollectorLoop();
}
