import "dotenv/config";
import { Cloudflare } from "cloudflare";

import type { Image } from "../types";

const { CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_DB_ID } = process.env;

/** Database connection class for managing Cloudflare D1 database operations. */
export class DatabaseConnection {
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

  async addImage(image: Image): Promise<boolean> {
    const response = await this._client.d1.database.query(CLOUDFLARE_DB_ID!, {
      account_id: CLOUDFLARE_ACCOUNT_ID!,
      sql: 'INSERT INTO "posted_images" ("id", "phash", "user_name", "guild_id", "channel_id", "message_id", "timestamp") VALUES (?, ?, ?, ?, ?, ?, ?)',
      params: [
        image.id,
        image.phash,
        image.user_name,
        image.guild_id,
        image.channel_id,
        image.message_id,
        image.timestamp.toString()
      ]
    });
    return Boolean(response.result[0].success);
  }

  /**
   * Retrieves the most recently posted images from the database.
   * @param {number} [limit=100] - Maximum number of images to retrieve
   * @returns {Promise<Image[]>} Promise that resolves to an array of Image objects ordered by posted timestamp (newest first)
   * @throws {Error} When database query fails or required environment variables are missing
   */
  async getRecentImages(limit: number = 100): Promise<Image[]> {
    const response = await this._client.d1.database.query(CLOUDFLARE_DB_ID!, {
      account_id: CLOUDFLARE_ACCOUNT_ID!,
      sql: 'SELECT * from "posted_images" ORDER BY "timestamp" DESC LIMIT ?',
      params: [limit.toString()]
    });

    return response.result[0].results as Image[];
  }

  /**
   * Retrieves a specific image by its perceptual hash.
   * @param {string} phash - The perceptual hash of the image to find
   * @returns {Promise<Image | undefined>} Promise that resolves to the Image object if found, undefined otherwise
   * @throws {Error} When database query fails or required environment variables are missing
   */
  async getImagesByPhash(phash: string): Promise<Image[]> {
    return (
      await this._client.d1.database.query(CLOUDFLARE_DB_ID!, {
        account_id: CLOUDFLARE_ACCOUNT_ID!,
        sql: 'SELECT * from "posted_images" where "phash" = ? ORDER BY "timestamp" ASC',
        params: [phash]
      })
    ).result[0].results as Image[];
  }
}
