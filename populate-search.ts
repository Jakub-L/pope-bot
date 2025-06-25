import "dotenv/config";
import { Database } from "./src/utils";
import { v4 } from "uuid";

const {
  CLOUDFLARE_API_TOKEN,
  CLOUDFLARE_ACCOUNT_ID = "",
  CLOUDFLARE_DB_ID = ""
} = process.env;

const db = new Database();

const addImage = async (phash: string): Promise<void> => {
  const hexHash = BigInt(`0b${phash}`).toString(16).padStart(16, "0").match(/.{2}/g);
  if (!hexHash) return;
  let parent = hexHash[0];

  db._client.d1.database.query(CLOUDFLARE_DB_ID, {
    account_id: CLOUDFLARE_ACCOUNT_ID,
    sql: `INSERT INTO phash_search_0 (id, hex) VALUES (?, ?) ON CONFLICT DO NOTHING`,
    params: [parent, parent]
  });

  for (let i = 1; i < 7; i += 1) {
    const hex = hexHash[i];
    db._client.d1.database.query(CLOUDFLARE_DB_ID, {
      account_id: CLOUDFLARE_ACCOUNT_ID,
      sql: `INSERT INTO phash_search_${i} (id, parent_hex, hex) VALUES (?, ?, ?) ON CONFLICT DO NOTHING`,
      params: [`${parent}-${hex}`, parent, hex]
    });
    parent = hex;
  }

  db._client.d1.database.query(CLOUDFLARE_DB_ID, {
    account_id: CLOUDFLARE_ACCOUNT_ID,
    sql: `INSERT INTO phash_search_7 (id, parent_hex, hex, repost_id) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING`,
    params: [`${parent}-${hexHash[7]}`, parent, hexHash[7], v4()]
  });
};

addImage("1000011000111011011111000011100010001100001100000111000100110011");
