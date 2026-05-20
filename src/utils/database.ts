import "dotenv/config";
import { Cloudflare } from "cloudflare";
import { v4 as uuid } from "uuid";

import type { Image, ImageUpdate, PopeGet } from "../types";

const { CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID = "", CLOUDFLARE_DB_ID = "" } = process.env;

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

  async getImages(
    fields: string[] = ["*"],
    filter: Partial<Record<keyof Image, string | string[]>> = {}
  ): Promise<Image[]> {
    const { whereClause, params } = this._buildWhereClause(filter);
    return ((
      await this._client.d1.database.query(CLOUDFLARE_DB_ID, {
        account_id: CLOUDFLARE_ACCOUNT_ID,
        sql: `
          SELECT ${fields.join(", ")} FROM images
          ${whereClause}
          ORDER BY first_post_timestamp DESC`,
        params
      })
    ).result[0].results ?? []) as Image[];
  }

  async addImage(update: ImageUpdate): Promise<Image> {
    const response = (
      await this._client.d1.database.query(CLOUDFLARE_DB_ID, {
        account_id: CLOUDFLARE_ACCOUNT_ID,
        sql: `
        INSERT INTO images (
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
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(phash) DO UPDATE SET
            last_post_user_name =
              CASE
                WHEN last_post_timestamp < EXCLUDED.last_post_timestamp
                THEN EXCLUDED.last_post_user_name
                ELSE last_post_user_name
              END,
            last_post_channel_id =
              CASE
                WHEN last_post_timestamp < EXCLUDED.last_post_timestamp
                THEN EXCLUDED.last_post_channel_id
                ELSE last_post_channel_id
              END,
            last_post_message_id =
              CASE
                WHEN last_post_timestamp < EXCLUDED.last_post_timestamp
                THEN EXCLUDED.last_post_message_id
                ELSE last_post_message_id
              END,
            last_post_timestamp =
              CASE
                WHEN last_post_timestamp < EXCLUDED.last_post_timestamp
                THEN EXCLUDED.last_post_timestamp
                ELSE last_post_timestamp
              END,
            count = images.count + 1
          RETURNING *
        `,
        params: [
          update.phash,
          update.guild_id,
          update.user_name,
          update.channel_id,
          update.message_id,
          String(update.timestamp),
          update.user_name,
          update.channel_id,
          update.message_id,
          String(update.timestamp),
          String(update.count ?? 1)
        ]
      })
    ).result[0].results?.[0] as Image;
    return response;
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

  async getPopeGet(userId: string): Promise<PopeGet | null> {
    const popeGets = (
      await this._client.d1.database.query(CLOUDFLARE_DB_ID, {
        account_id: CLOUDFLARE_ACCOUNT_ID,
        sql: `SELECT * FROM gets WHERE user_id = ?`,
        params: [userId]
      })
    ).result[0].results?.[0];
    return popeGets ? (popeGets as PopeGet) : null;
  }

  async recordFirstGet(userId: string, userName: string, timestamp: number): Promise<void> {
    await this._client.d1.database.query(CLOUDFLARE_DB_ID, {
      account_id: CLOUDFLARE_ACCOUNT_ID,
      sql: `
        INSERT INTO gets (user_id, user_name, last_get_timestamp, total_gets, get_streak) VALUES (?, ?, ?, 1, 1)
      `,
      params: [userId, userName, String(timestamp)]
    });
  }

  async recordGet(userId: string, timestamp: number, newStreak: number): Promise<void> {
    await this._client.d1.database.query(CLOUDFLARE_DB_ID, {
      account_id: CLOUDFLARE_ACCOUNT_ID,
      sql: `
        UPDATE gets
        SET
          last_get_timestamp = ?,
          total_gets = total_gets + 1,
          get_streak = ?
        WHERE user_id = ?
      `,
      params: [String(timestamp), String(newStreak), userId]
    });
  }

  async getStats(order: "total_gets" | "get_streak" = "total_gets"): Promise<PopeGet[]> {
    return ((
      await this._client.d1.database.query(CLOUDFLARE_DB_ID, {
        account_id: CLOUDFLARE_ACCOUNT_ID,
        sql: `SELECT * FROM gets ORDER BY ${order} DESC LIMIT 5`
      })
    ).result[0].results ?? []) as PopeGet[];
  }

  private _buildWhereClause(filter: Partial<Record<keyof Image, string | string[]>>): {
    whereClause: string;
    params: any[];
  } {
    const conditions: string[] = [];
    const params: any[] = [];
    for (const [key, value] of Object.entries(filter)) {
      if (value === null || value === undefined) continue;
      if (Array.isArray(value) && value.length !== 0) {
        const placeholders = value.map(() => "?").join(", ");
        conditions.push(`${key} IN (${placeholders})`);
        params.push(...value);
      } else {
        conditions.push(`${key} = ?`);
        params.push(value);
      }
    }
    return {
      whereClause: conditions.length > 0 ? `WHERE (${conditions.join(" AND ")})` : "",
      params
    };
  }
}
