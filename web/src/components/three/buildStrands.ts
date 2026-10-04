/**
 * Builds strand curve points from fingerprint keys (seeded pseudo-random).
 * Pure function, no Three.js dependency so it can be tested without canvas.
 */
export interface StrandPoint { x: number; y: number; z: number; }

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function hashToSeed(hex: string): number {
  let h = 0;
  for (let i = 2; i < Math.min(hex.length, 18); i++) {
    h = (h * 31 + hex.charCodeAt(i)) & 0xffffffff;
  }
  return h >>> 0;
}

/**
 * Builds strand polylines seeded by the five fingerprint keys.
 * @param keys - fingerprint keys as hex strings
 * @param count - number of strands to generate
 * @returns array of strands, each a list of points
 */
export function buildStrands(keys: string[], count = 5): StrandPoint[][] {
  return keys.slice(0, count).map((key, idx) => {
    const rand = seededRandom(hashToSeed(key) ^ (idx * 0x9e3779b9));
    const points: StrandPoint[] = [];
    const segments = 24;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * Math.PI * 2 * (0.5 + rand() * 0.5) + idx * 1.1;
      const radius = 1.2 + Math.sin(t * Math.PI) * 0.6 + (rand() - 0.5) * 0.2;
      const y = (t - 0.5) * 6 + (rand() - 0.5) * 0.4;
      points.push({
        x: Math.cos(angle) * radius,
        y,
        z: Math.sin(angle) * radius * 0.6,
      });
    }
    return points;
  });
}
