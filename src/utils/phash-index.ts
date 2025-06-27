type Tree = { [key: string]: Tree | boolean };

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
}
