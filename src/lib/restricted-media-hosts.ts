/**
 * CDNs da Meta (WhatsApp/Facebook/Instagram) frequentemente respondem 403 a
 * <img>/<video> no nosso dominio (cookies, referrer, TTL curto). Evita o
 * primeiro request que so polui o console e cai no mesmo fallback.
 */
export function isMetaCdnLikelyToBlockInlineEmbed(url: string | null | undefined): boolean {
  const raw = typeof url === "string" ? url.trim() : "";
  if (!raw || raw.startsWith("data:") || raw.startsWith("/")) {
    return false;
  }

  try {
    const host = new URL(raw).hostname.toLowerCase();
    return (
      host.includes("fbcdn.net") ||
      host.includes("facebook.com") ||
      host.includes("fbsbx.com") ||
      host.includes("instagram.com") ||
      host.includes("cdninstagram.com")
    );
  } catch {
    return false;
  }
}
