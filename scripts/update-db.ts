import { readdirSync, readFileSync } from "fs";
import { ImageUpdate } from "../src/types";
import { Database } from "../src/utils";

import "dotenv/config";

const BATCH_SIZE = 200;

const db = new Database();

const main = async () => {
  const fileName: string | undefined = readdirSync("./export")
    .filter((fileName: string) => fileName.startsWith("updates-"))
    .sort()
    .pop();
  if (!fileName) process.exit(1);
  const file: string = readFileSync(`./export/${fileName}`, "utf-8");
  const { updates }: { updates: ImageUpdate[] } = JSON.parse(file);

  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE);
    console.log(`Processing items ${i + 1} to ${i + BATCH_SIZE}...`);

    await Promise.all(batch.map(update => db.addImage(update)));
  }
};

main();
