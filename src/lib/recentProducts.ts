export type RecentProduct = { id: string; productName: string; thumbnail: string };

const KEY = "recentProducts";
const MAX = 3;
export const RECENT_EVENT = "recentProductsChanged";

export function readRecent(): RecentProduct[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function addRecent(p: RecentProduct) {
  try {
    const next = [p, ...readRecent().filter((x) => x.id !== p.id)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(RECENT_EVENT));
  } catch {
    /* storage unavailable */
  }
}
