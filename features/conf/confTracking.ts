"use client";

/**
 * Client-side tracking helpers for the /conf landing page.
 *
 * Goals:
 * - Stable visitor_id stored in localStorage so repeat visits can be detected.
 * - Fresh scan_id for every page open so individual scans can be joined to leads.
 * - Send exactly one pageview event per logical page open, even when React 18
 *   Strict Mode runs the mounting effect twice in development.
 *
 * The token used to talk to Airtable lives only in the server route
 * (`/api/conf-tracking`). This module never sees it.
 */

const VISITOR_ID_KEY = "tm_conf_visitor_id";
const VISITED_FLAG_KEY = "tm_conf_visited";

const isBrowser = () => typeof window !== "undefined";

const safeRandomId = (): string => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  // Fallback for very old browsers / non-secure contexts.
  return `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}-${Math.random().toString(36).slice(2, 10)}`;
};

export const getOrCreateVisitorId = (): string => {
  if (!isBrowser()) return "";
  try {
    const existing = window.localStorage.getItem(VISITOR_ID_KEY);
    if (existing && existing.length > 0) return existing;
    const fresh = safeRandomId();
    window.localStorage.setItem(VISITOR_ID_KEY, fresh);
    return fresh;
  } catch {
    // localStorage may throw in private mode / when disabled.
    return safeRandomId();
  }
};

export const createScanId = (): string => safeRandomId();

/**
 * Returns true when this visitor has never opened /conf before.
 * IMPORTANT: must be called BEFORE markVisited() so the first-open detection
 * is accurate.
 */
export const readIsUniqueVisitor = (): boolean => {
  if (!isBrowser()) return true;
  try {
    return window.localStorage.getItem(VISITED_FLAG_KEY) !== "1";
  } catch {
    return true;
  }
};

export const markVisited = (): void => {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(VISITED_FLAG_KEY, "1");
  } catch {
    // Ignore — non-blocking.
  }
};

export interface ConfTrackingContext {
  visitorId: string;
  scanId: string;
  isUniqueVisitor: boolean;
}

/**
 * Module-scoped guard so the pageview POST never fires twice for the same
 * logical page open. A useRef would NOT be enough because React 18 Strict Mode
 * unmounts and remounts components in development, which resets refs and state.
 * Module variables survive that double-mount cycle.
 *
 * Trade-off: when the user navigates away via SPA routing and comes back to
 * /conf in the same tab, no new pageview is fired. For a QR campaign landing
 * page this is acceptable — the page is the entry point, not a hub people
 * bounce in and out of.
 */
let hasFiredConfPageview = false;

export interface FireConfPageviewArgs extends ConfTrackingContext {
  language: string;
}

export const fireConfPageviewOnce = async (
  args: FireConfPageviewArgs
): Promise<void> => {
  if (!isBrowser()) return;
  if (hasFiredConfPageview) return;
  hasFiredConfPageview = true;

  const payload = {
    visitorId: args.visitorId,
    scanId: args.scanId,
    isUniqueVisitor: args.isUniqueVisitor,
    userAgent:
      typeof navigator !== "undefined" ? navigator.userAgent || "" : "",
    referrer: typeof document !== "undefined" ? document.referrer || "" : "",
    language: args.language || "",
  };

  try {
    const response = await fetch("/api/conf-tracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
    if (!response.ok) {
      // Surface server-side issues during development without blocking UX.
      console.warn(
        "[conf-tracking] non-ok response",
        response.status,
        await response.text().catch(() => "")
      );
    }
  } catch (error) {
    console.warn("[conf-tracking] network error", error);
  }
};
