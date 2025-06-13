interface RateEntry {
  count: number;
  expires: number;
}

const store = new Map<string, RateEntry>();

export function isRateLimited(key: string, limit = 10, windowMs = 60_000): boolean {
  const entry = store.get(key);
  const now = Date.now();
  if (!entry || entry.expires < now) {
    store.set(key, { count: 1, expires: now + windowMs });
    return false;
  }
  if (entry.count >= limit) {
    return true;
  }
  entry.count += 1;
  return false;
}
