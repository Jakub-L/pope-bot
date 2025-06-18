import { readFileSync } from "fs";
import { ImageUpdate } from "../src/types";
import { Database } from "../src/utils";

import "dotenv/config";

const db = new Database();

const main = async () => {
  const updates: ImageUpdate[] = JSON.parse(readFileSync("./temp/updates.json", "utf-8"));

  for (let i = 0; i < updates.length; i++) {
    if (i > 0 && i % 100 === 0) console.log(`Processed ${i}/${updates.length} updates...`);
    const update = updates[i];
    const existingImage = await db.getImages({ phash: update.phash });
    if (existingImage.length > 0) await db.updateImage(update);
    else await db.addImage(update);
  }
};

main();
