import { appendFileSync, readFileSync, writeFileSync } from "fs";
import { Link } from "../src/types";
import { getUpdate } from "../src/utils";

const main = async () => {
  const file = readFileSync("./temp/links.json", "utf-8");
  const links: Link[] = JSON.parse(file);

  let errorCount = 0;
  let isFirstWrite = true;

  console.log(`Total links to process: ${links.length}`);
  writeFileSync("./temp/updates.json", "[", "utf-8");

  for (let i = 0; i < links.length; i++) {
    if (i > 0 && i % 100 === 0) console.log(`Processed ${i}/${links.length} links...`);
    if (i < 60550) continue;
    const link = links[i];
    try {
      const update = await getUpdate(link);
      if (update !== null) {
        appendFileSync(
          "./temp/updates.json",
          `${isFirstWrite ? "" : ","}${JSON.stringify(update)}`,
          "utf-8"
        );
        isFirstWrite = false;
      }
    } catch (error) {
      console.log(`Errors: ${++errorCount}`);
    }
  }

  appendFileSync("./temp/updates.json", "]", "utf-8");
};

main();
