import AsyncStorage from "@react-native-async-storage/async-storage";

/** A small, device-local list of PUBLIC property ids; never persist contacts or private listing data. */
const KEY = "amlak:recently-viewed:v1";
const LIMIT = 6;
const isId = (value: unknown): value is string =>
 typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export function sanitizeRecentlyViewed(raw: unknown): string[] {
 if (!Array.isArray(raw)) return [];
 return [...new Set(raw.filter(isId))].slice(0, LIMIT);
}

export async function getRecentlyViewedIds(): Promise<string[]> {
 try {
  const raw = await AsyncStorage.getItem(KEY);
  return sanitizeRecentlyViewed(raw ? JSON.parse(raw) as unknown : null);
 } catch { return []; }
}

// Serialize writes so rapidly opening two listings never drops one of the IDs.
let pending: Promise<void> = Promise.resolve();
export function markRecentlyViewed(id: string): Promise<void> {
 if (!isId(id)) return Promise.resolve();
 const next = pending.then(async () => {
  const previous = await getRecentlyViewedIds();
  await AsyncStorage.setItem(KEY, JSON.stringify([id, ...previous.filter(value => value !== id)].slice(0, LIMIT)));
 });
 pending = next.catch(() => {});
 return next;
}
