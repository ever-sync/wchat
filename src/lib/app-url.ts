export function getAppUrl() {
  const envUrl = import.meta.env.VITE_APP_URL as string | undefined;

  if (envUrl?.trim()) {
    return envUrl.trim().replace(/\/+$/, "");
  }

  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }

  return "http://localhost:8080";
}
