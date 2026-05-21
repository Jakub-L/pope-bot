import { SimilarHashes } from "../types";

type SearchResult = { hex: string; diff: number };

const DEFAULT_CAPACITY = 64_000;

export class PhashIndex {
  private _hashes: BigUint64Array;
  private _size = 0;
  private _capacity: number;

  constructor(initialCapacity = DEFAULT_CAPACITY) {
    this._capacity = initialCapacity;
    this._hashes = new BigUint64Array(initialCapacity);
  }

  /**
   * Adds a perceptual hash (phash) to the index.
   * @param phashHex - The perceptual hash in hexadecimal format (8 bytes).
   * @throws Will throw an error if the phash is not exactly 8 bytes long.
   */
  public add(phashHex: string): void {
    if (phashHex.length !== 16) throw new Error(`Invalid phash length: ${phashHex}`);
    if (this._size >= this._capacity) this._grow();
    this._hashes[this._size++] = BigInt(`0x${phashHex}`);
  }

  /**
   * Removes a perceptual hash (phash) from the index.
   * @param phashHex - The perceptual hash in hexadecimal format (8 bytes).
   * @throws Will throw an error if the phashHex is not exactly 8 bytes.
   */
  public remove(phashHex: string): void {
    if (phashHex.length !== 16) throw new Error(`Invalid phash length: ${phashHex}`);
    const target = BigInt(`0x${phashHex}`);
    for (let i = 0; i < this._size; i++) {
      if (this._hashes[i] === target) {
        this._hashes[i] = this._hashes[--this._size];
        return;
      }
    }
  }

  /**
   * Finds similar perceptual hashes (phashes) within a given threshold.
   * @param phashHex - The perceptual hash in hexadecimal format (8 bytes).
   * @param threshold - The maximum allowed difference in bits between the phash and the stored phashes.
   * @returns An array of SearchResult objects containing the similar phashes and their differences.
   * @throws Will throw an error if the phashHex does not have exactly 8 bytes.
   */
  public findSimilar(phashHex: string, threshold: number): SearchResult[] {
    const target = BigInt(`0x${phashHex}`);
    const results: SearchResult[] = [];
    for (let i = 0; i < this._size; i++) {
      const diff = this._countSetBits(this._hashes[i] ^ target, threshold);
      if (diff <= threshold) {
        results.push({ hex: this._hashes[i].toString(16).padStart(16, "0"), diff });
      }
    }
    return results;
  }

  /**
   * Counts the number of set bits (1s) in a 64-bit integer using Kernighan's algorithm.
   * @param n - The 64-bit integer to count the set bits of.
   * @param threshold - The maximum allowed difference in bits between the phash and the stored
   *                    phashes.
   * @returns The number of set bits in the integer or Number.MAX_SAFE_INTEGER if the difference is
   *          greater than the threshold.
   */
  private _countSetBits(n: bigint, threshold: number): number {
    let count = 0;
    while (n) {
      n &= n - 1n;
      count++;
      if (count > threshold) return Number.MAX_SAFE_INTEGER;
    }
    return count;
  }

  /** Doubles the capacity of the index. */
  private _grow(): void {
    this._capacity *= 2;
    const newArr = new BigUint64Array(this._capacity);
    newArr.set(this._hashes);
    this._hashes = newArr;
  }
}

export const groupSimilarImages = (results: SearchResult[]): SimilarHashes => {
  const similar: SimilarHashes = { exact: [], close: [], similar: [] };
  for (const result of results) {
    if (result.diff === 0) similar.exact.push(result.hex);
    else if (result.diff <= 4) similar.close.push(result.hex);
    else similar.similar.push(result.hex);
  }
  return similar;
};
