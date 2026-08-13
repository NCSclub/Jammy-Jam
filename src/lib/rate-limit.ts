import "server-only";

/**
 * Best-effort in-memory throttle, shared by the public sign-up endpoint and
 * the staff login.
 *
 * It lives in memory, so on serverless it is per instance rather than global —
 * enough to stop a naive script hammering one endpoint, not a distributed
 * flood. The routes that use it layer their own second defence on top (the
 * unique email constraint, the timing-safe password compare).
 */
export function createRateLimiter({ max, windowMs }: { max: number; windowMs: number }) {
  const hits = new Map<string, number[]>();

  function prune(now: number) {
    /* keep the map from growing forever on a long-lived instance */
    if (hits.size <= 5000) return;
    for (const [key, times] of hits) {
      if (!times.some((at) => now - at < windowMs)) hits.delete(key);
    }
  }

  return {
    /** True if this key is still under the limit; records the hit if so. */
    hit(key: string) {
      const now = Date.now();
      const recent = (hits.get(key) ?? []).filter((at) => now - at < windowMs);

      if (recent.length >= max) return false;

      recent.push(now);
      hits.set(key, recent);
      prune(now);
      return true;
    },

    /** Forgive a key — a successful login should not eat into the budget. */
    clear(key: string) {
      hits.delete(key);
    },
  };
}

/** The caller's address as the throttle key, best effort behind a proxy. */
export function requestIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
