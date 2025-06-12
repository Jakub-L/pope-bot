import "dotenv/config";
import { Cloudflare } from "cloudflare";

import type { Image } from "../types";

const {
  CLOUDFLARE_API_TOKEN,
  CLOUDFLARE_ACCOUNT_ID = "",
  CLOUDFLARE_DB_ID = ""
} = process.env;

// TODO:
// - Change the system to only store one phash per image
// - Add a secondary table to store the first/last time an image was posted, and by whom
// - Ensure the ID is per-server, not globally unique

/** Database connection class for managing Cloudflare D1 database operations. */
export class Database {
  /** Private Cloudflare client instance for database operations. */
  private _client: Cloudflare;

  /**
   * Creates a new DatabaseConnection instance.
   * Initializes the Cloudflare client with API token from environment variables.
   * Requires CLOUDFLARE_API_TOKEN to be set in environment.
   */
  constructor() {
    this._client = new Cloudflare({
      apiToken: CLOUDFLARE_API_TOKEN
    });
  }

  async getImages(filter: Partial<Image> = {}): Promise<Image[]> {
    const { whereClause, params } = this._buildWhereClause(filter);
    return ((
      await this._client.d1.database.query(CLOUDFLARE_DB_ID, {
        account_id: CLOUDFLARE_ACCOUNT_ID,
        sql: `SELECT * FROM images ${whereClause} ORDER BY first_post_timestamp DESC`,
        params
      })
    ).result[0].results ?? []) as Image[];
  }

  private _buildWhereClause(filter: Partial<Image>): { whereClause: string; params: any[] } {
    const conditions: string[] = [];
    const params: any[] = [];
    for (const [key, value] of Object.entries(filter)) {
      if (value !== undefined) {
        conditions.push(`${key} = ?`);
        params.push(value);
      }
    }
    return {
      whereClause: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
      params
    };
  }
}
