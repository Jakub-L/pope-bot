import "dotenv/config";

import { formatDate, formatISO } from "date-fns";
import fs from "fs";
import path from "path";

const { IGNORE_LOGGING = "false" } = process.env;

export const log = (message: string): void => {
  if (IGNORE_LOGGING === "true") return;
  const logPath = path.join(__dirname, `../logs/${formatDate(new Date(), "yyyy-MM-dd")}.log`);
  if (!fs.existsSync(logPath)) {
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.writeFileSync(logPath, "", "utf8");
  }
  fs.appendFile(logPath, `${formatISO(new Date())} | ${message}\n`, "utf8", err => {
    if (err !== null) console.error("Error writing to log file:", err);
  });
};
