const CHUNK_RELOAD_FLAG = "wchat-chunk-reloaded";

function isChunkLoadErrorMessage(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("failed to fetch dynamically imported module") ||
    normalized.includes("failed to load module script") ||
    normalized.includes("chunkloaderror") ||
    normalized.includes("imported module")
  );
}

function reloadOnce() {
  if (typeof window === "undefined") return;
  try {
    if (window.sessionStorage.getItem(CHUNK_RELOAD_FLAG) === "1") {
      return;
    }
    window.sessionStorage.setItem(CHUNK_RELOAD_FLAG, "1");
  } catch {
    // ignore storage failures
  }

  const url = new URL(window.location.href);
  url.searchParams.set("_reload", Date.now().toString(36));
  window.location.replace(url.toString());
}

export function installChunkLoadRecovery() {
  if (typeof window === "undefined") return () => {};

  const handleError = (event: ErrorEvent) => {
    const message = event.message || event.error?.message || "";
    if (!message || !isChunkLoadErrorMessage(message)) {
      return;
    }
    reloadOnce();
  };

  const handleRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const message =
      typeof reason === "string"
        ? reason
        : reason instanceof Error
          ? reason.message
          : typeof reason?.message === "string"
            ? reason.message
            : "";
    if (!message || !isChunkLoadErrorMessage(message)) {
      return;
    }
    reloadOnce();
  };

  window.addEventListener("error", handleError);
  window.addEventListener("unhandledrejection", handleRejection);

  return () => {
    window.removeEventListener("error", handleError);
    window.removeEventListener("unhandledrejection", handleRejection);
  };
}
