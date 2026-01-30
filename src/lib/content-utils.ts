export type ContentKind = "video" | "youtube" | "pdf" | "other";

export function normalizeContentUrl(raw?: string): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  const badEmbedPrefix = "https://www.youtube.com/embed/";
  // Some API items incorrectly include an embed prefix before a direct asset URL.
  if (trimmed.startsWith(badEmbedPrefix)) {
    const rest = trimmed.slice(badEmbedPrefix.length);
    if (rest.startsWith("http://") || rest.startsWith("https://")) return rest;
  }
  return trimmed;
}

function safePathname(url?: string): string {
  if (!url) return "";
  try {
    return new URL(url).pathname.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

export function getContentKind(url?: string): ContentKind {
  if (!url) return "other";

  const u = url.toLowerCase();
  const path = safePathname(url);

  // PDFs
  if (
    u.includes(".pdf") ||
    path.endsWith(".pdf") ||
    path.includes("/pdf/") ||
    path.includes("file_manager/pdf") ||
    path.includes("file_library/pdf")
  ) {
    return "pdf";
  }

  // YouTube
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";

  // Video
  if (
    u.includes(".mp4") ||
    u.includes(".webm") ||
    u.includes(".m3u8") ||
    path.includes("/videos/") ||
    path.includes("/enc_plain_mp4/") ||
    u.includes("cloudfront")
  ) {
    return "video";
  }

  return "other";
}

export function toYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (u.hostname.includes("youtube.com")) {
      if (u.pathname.startsWith("/embed/")) return url;
      const v = u.searchParams.get("v");
      return v ? `https://www.youtube.com/embed/${v}` : null;
    }
  } catch {
    // ignore
  }
  return null;
}

export function isSameContent(a?: { id: string; url?: string } | null, b?: { id: string; url?: string } | null) {
  if (!a || !b) return false;
  return a.id === b.id && normalizeContentUrl(a.url) === normalizeContentUrl(b.url);
}
