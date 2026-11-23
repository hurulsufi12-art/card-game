// HARBORBOUND — the one and only source of randomness: mulberry32.
// Every shuffle, deal and backdrop position goes through createRandom(seed).
// No Math.random() anywhere in the game: a fixed seed replays identically.
export function createRandom(seed) {
  let a = (Number(seed) || 0) >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
