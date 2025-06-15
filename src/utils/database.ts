import "dotenv/config";
import { Cloudflare } from "cloudflare";
import { v4 as uuid } from "uuid";

import type { Image, ImageUpdate } from "../types";

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
        sql: `
          SELECT * FROM images
          ${whereClause}
          ORDER BY first_post_timestamp DESC`,
        params
      })
    ).result[0].results ?? []) as Image[];
  }

  async addImage(update: ImageUpdate): Promise<Image> {
    return (
      await this._client.d1.database.query(CLOUDFLARE_DB_ID, {
        account_id: CLOUDFLARE_ACCOUNT_ID,
        sql: `
        INSERT INTO images (
          id,
          phash,
          guild_id,
          first_post_user_name,
          first_post_channel_id,
          first_post_message_id,
          first_post_timestamp,
          last_post_user_name,
          last_post_channel_id,
          last_post_message_id,
          last_post_timestamp,
          count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        RETURNING *`,
        params: [
          `${update.guild_id}-${update.phash}`,
          update.phash,
          update.guild_id,
          update.user_name,
          update.channel_id,
          update.message_id,
          String(update.timestamp),
          update.user_name,
          update.channel_id,
          update.message_id,
          String(update.timestamp)
        ]
      })
    ).result[0].results?.[0] as Image;
  }

  async updateImage(update: ImageUpdate): Promise<Image> {
    return (
      await this._client.d1.database.query(CLOUDFLARE_DB_ID, {
        account_id: CLOUDFLARE_ACCOUNT_ID,
        sql: `
        UPDATE images
        SET
          last_post_user_name = ?,
          last_post_channel_id = ?,
          last_post_message_id = ?,
          last_post_timestamp = ?,
          count = count + 1
        WHERE id = ?
        RETURNING *
      `,
        params: [
          update.user_name,
          update.channel_id,
          update.message_id,
          String(update.timestamp),
          `${update.guild_id}-${update.phash}`
        ]
      })
    ).result[0].results?.[0] as Image;
  }

  async getLastImport(): Promise<number | null> {
    const imports = (
      await this._client.d1.database.query(CLOUDFLARE_DB_ID, {
        account_id: CLOUDFLARE_ACCOUNT_ID,
        sql: `SELECT timestamp FROM imports ORDER BY timestamp DESC LIMIT 1`
      })
    ).result[0].results?.[0];
    return imports ? (imports as { timestamp: number }).timestamp : null;
  }

  async recordImport(timestamp: number): Promise<void> {
    await this._client.d1.database.query(CLOUDFLARE_DB_ID, {
      account_id: CLOUDFLARE_ACCOUNT_ID,
      sql: `INSERT INTO imports (id, timestamp) VALUES (?, ?)`,
      params: [uuid(), String(timestamp)]
    });
  }

  async deleteAllImages(): Promise<void> {
    await this._client.d1.database.query(CLOUDFLARE_DB_ID, {
      account_id: CLOUDFLARE_ACCOUNT_ID,
      sql: `DELETE FROM images`
    });
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
