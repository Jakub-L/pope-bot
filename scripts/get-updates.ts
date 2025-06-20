import { appendFileSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { ImageUpdate, Link } from "../src/types";
import { getUpdate } from "../src/utils";

const BATCH_SIZE = 200;

const processLink = async (
  link: Link,
  stats: Record<string, any>
): Promise<ImageUpdate | null> => {
  try {
    const update = await getUpdate(link);
    if (update !== null) {
      stats.validUpdates++;
      return update;
    }
  } catch (error) {
    stats.errorCount++;
  }
  return null;
};

const main = async () => {
  const fileName: string | undefined = readdirSync("./export")
    .filter((fileName: string) => fileName.startsWith("links-"))
    .sort()
    .pop();
  if (!fileName) process.exit(1);
  const file: string = readFileSync(`./export/${fileName}`, "utf-8");
  const { timestamp, links }: { timestamp: number; links: Link[] } = JSON.parse(file);
  const stats: Record<string, any> = {
    totalLinks: links.length,
    errorCount: 0,
    validUpdates: 0
  };
  const updates: ImageUpdate[] = [];

  console.log(`Processing file: ${fileName}`);

  console.log(`Total links to process: ${links.length}`);
  writeFileSync(
    `./export/updates-${timestamp}.json`,
    `{ "timestamp": ${timestamp}, "updates": `,
    "utf-8"
  );

  for (let i = 0; i < links.length; i += BATCH_SIZE) {
    const batch = links.slice(i, i + BATCH_SIZE);
    console.log(`Processing items ${i + 1} to ${i + BATCH_SIZE}...`);

    const results = await Promise.all(batch.map(link => processLink(link, stats)));
    for (const update of results) {
      if (update !== null) updates.push(update);
    }
  }

  appendFileSync(`./export/updates-${timestamp}.json`, JSON.stringify(updates), "utf-8");
  appendFileSync(`./export/updates-${timestamp}.json`, "}", "utf-8");

  const existingStats = JSON.parse(readFileSync("./stats/get-updates.json", "utf-8"));
  writeFileSync(
    "./stats/get-updates.json",
    JSON.stringify(
      {
        ...existingStats,
        [timestamp]: stats
      },
      null,
      2
    ),
    "utf-8"
  );
};

main();
