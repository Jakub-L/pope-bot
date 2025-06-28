type Tree = { [key: string]: Tree | boolean };
type SearchNode = { path: string; target: Tree; diff: number };
type SearchResult = { hex: string; diff: number };

export class PhashIndex {
  public _index: Tree = {};

  /**
   * Adds a perceptual hash (phash) to the index.
   * @param phashHex - The perceptual hash in hexadecimal format (8 bytes).
   * @throws Will throw an error if the phashHex is not a valid hexadecimal string
   *         or if it does not have exactly 8 bytes.
   */
  public add(phashHex: string): void {
    const bytes = phashHex.match(/.{2}/g);
    if (!bytes) throw new Error(`Invalid phash bytes: ${phashHex}`);
    if (bytes.length !== 8) throw new Error(`Invalid phash length: ${phashHex}`);
    this._deepSet(bytes, true);
  }

  /**
   * Removes a perceptual hash (phash) from the index.
   * @param phashHex - The perceptual hash in hexadecimal format (8 bytes).
   * @throws Will throw an error if the phashHex is not a valid hexadecimal string
   *         or if it does not have exactly 8 bytes.
   */
  public remove(phashHex: string): void {
    const bytes = phashHex.match(/.{2}/g);
    if (!bytes) throw new Error(`Invalid phash bytes: ${phashHex}`);
    if (bytes.length !== 8) throw new Error(`Invalid phash length: ${phashHex}`);
    this._deepDelete(bytes);
    this._prune();
  }

  /**
   * Finds similar perceptual hashes (phashes) within a given threshold.
   * @param phashHex - The perceptual hash in hexadecimal format (8 bytes).
   * @param threshold - The maximum allowed difference in bits between the phash and the stored phashes.
   * @returns An array of SearchResult objects containing the similar phashes and their differences.
   * @throws Will throw an error if the phashHex does not have exactly 8 bytes.
   */
  public findSimilar(phashHex: string, threshold: number): SearchResult[] {
    if (phashHex.length !== 16) throw new Error(`Invalid phash length: ${phashHex}`);

    const results: SearchResult[] = [];
    const queue: SearchNode[] = [{ path: "", target: this._index, diff: 0 }];
    while (queue.length > 0) {
      const { path, target, diff } = queue.shift()!;
      const pathLength = path.length;
      for (const [key, value] of Object.entries(target)) {
        const newDiff = diff + this._bitDiff(key, phashHex.slice(pathLength, pathLength + 2));
        const newPath = `${path}${key}`;
        if (newDiff > threshold) continue;
        if (typeof value === "boolean") results.push({ hex: newPath, diff: newDiff });
        else if (typeof value === "object") {
          queue.push({ path: newPath, target: value as Tree, diff: newDiff });
        }
      }
    }
    return results;
  }

  /**
   * Sets a deeply nested value in an object given a path of keys.
   * @param path - An array of keys representing the path to the value to be set.
   * @param value - The value to be set.
   * @param target - The object in which the value should be set.
   * @returns void
   */
  private _deepSet(path: string[], value: boolean, target: Tree = this._index): void {
    const key = path[0];
    if (!(key in target)) target[key] = {};
    if (path.length === 1) target[key] = value;
    else this._deepSet(path.slice(1), value, target[key] as Tree);
  }

  /**
   * Recursively deletes a property from an object based on a given path.
   * @param path - An array of keys representing the path to the value to be deleted.
   * @param target - The object from which the property should be deleted.
   * @returns void
   */
  private _deepDelete(path: string[], target: Tree = this._index): void {
    const key = path[0];
    if (!(key in target)) return;
    if (path.length === 1) delete target[key];
    else this._deepDelete(path.slice(1), target[key] as Tree);
  }

  /**
   * Recursively prunes empty objects from the index tree.
   * If an object becomes empty after pruning, it is deleted.
   * @param target - The object to prune, defaults to the root index.
   * @returns void
   */
  private _prune(target: Tree = this._index): void {
    for (const [key, value] of Object.entries(target)) {
      if (typeof value === "object") {
        this._prune(value as Tree);
        if (Object.keys(value).length === 0) delete target[key];
      }
    }
  }

  /**
   * Finds the number of bits that differ between two hexadecimal numbers.
   * @param hexA - First hexadecimal number (as string)
   * @param hexB - Second hexadecimal number (as string)
   * @returns The number of differing bits between the two hexadecimal numbers.
   */
  private _bitDiff(hexA: string, hexB: string): number {
    let diff = parseInt(hexA, 16) ^ parseInt(hexB, 16);
    let count = 0;
    while (diff) {
      count += diff & 1;
      diff >>= 1;
    }
    return count;
  }
}
