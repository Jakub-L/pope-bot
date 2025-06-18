import { appendFileSync, readFileSync, writeFileSync } from "fs";
import { Link } from "../src/types";
import { getUpdate } from "../src/utils";

const main = async () => {
  const file = readFileSync("./temp/links.json", "utf-8");
  const { timestamp, links }: { timestamp: number; links: Link[] } = JSON.parse(file);

  const stats: Record<string, any> = {
    totalLinks: links.length,
    errorCount: 0,
    validUpdates: 0
  };
  let isFirstWrite = true;

  console.log(`Total links to process: ${links.length}`);
  writeFileSync("./temp/updates.json", `{ "timestamp": ${timestamp}, "updates": [`, "utf-8");

  for (let i = 0; i < links.length; i++) {
    if (i > 0 && i % 100 === 0) console.log(`Processed ${i}/${links.length} links...`);
    const link = links[i];
    try {
      const update = await getUpdate(link);
      if (update !== null) {
        stats.validUpdates++;
        appendFileSync(
          "./temp/updates.json",
          `${isFirstWrite ? "" : ","}${JSON.stringify(update)}`,
          "utf-8"
        );
        isFirstWrite = false;
      }
    } catch (error) {
      console.log(`Errors: ${++stats.errorCount}`);
    }
  }

  appendFileSync("./temp/updates.json", "]}", "utf-8");

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
