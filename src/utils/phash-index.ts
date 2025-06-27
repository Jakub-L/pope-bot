type Tree = { [key: string]: Tree | boolean };

export class PhashIndex {
  public _index: Tree = {};

  public add(phashHex: string): void {
    const bytes = phashHex.match(/.{2}/g);
    if (!bytes) throw new Error(`Invalid phash bytes: ${phashHex}`);
    if (bytes.length !== 8) throw new Error(`Invalid phash length: ${phashHex}`);
    this._deepSet(bytes, true);
  }

  public remove(phashHex: string): void {
    const bytes = phashHex.match(/.{2}/g);
    if (!bytes) throw new Error(`Invalid phash bytes: ${phashHex}`);
    if (bytes.length !== 8) throw new Error(`Invalid phash length: ${phashHex}`);
    this._deepDelete(bytes);
    this._prune();
  }

  private _deepSet(path: string[], value: boolean, target: Tree = this._index): void {
    const key = path[0];
    if (!(key in target)) target[key] = {};
    if (path.length === 1) target[key] = value;
    else this._deepSet(path.slice(1), value, target[key] as Tree);
  }

  private _deepDelete(path: string[], target: Tree = this._index): void {
    const key = path[0];
    if (!(key in target)) return;
    if (path.length === 1) delete target[key];
    else this._deepDelete(path.slice(1), target[key] as Tree);
  }

  private _prune(target: Tree = this._index): void {
    for (const [key, value] of Object.entries(target)) {
      if (typeof value === "object") {
        this._prune(value as Tree);
        if (Object.keys(value).length === 0) delete target[key];
      }
    }
  }
}
