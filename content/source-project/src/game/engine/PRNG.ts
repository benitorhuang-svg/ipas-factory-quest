/**
 * PRNG.ts — Deterministic Pseudo-Random Number Generator
 * Uses Mulberry32 algorithm: Fast, robust 32-bit state generator
 * Guarantees identical simulation runs across any client with the same seed.
 */

export class PRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** Return pseudo-random float in [0, 1) */
  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Return pseudo-random integer in [min, max] inclusive */
  public nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Return true with probability p (0 <= p <= 1) */
  public chance(p: number): boolean {
    return this.next() < p;
  }
}
