import { existsSync, mkdirSync, appendFileSync, writeFileSync, readFileSync } from "fs";
import "dotenv/config";
import { ChannelType, Client, Events, GatewayIntentBits } from "discord.js";

import { Database, getLinks } from "../src/utils";

const { DISCORD_TOKEN, DISCORD_EXCLUDED_GUILD_IDS = "" } = process.env;
const MAX_MESSAGES = Infinity;

const db = new Database();
const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages
  ]
});

discordClient.once(Events.ClientReady, async () => {
  let isFirstWrite = true;
  const excludedGuilds = new Set(DISCORD_EXCLUDED_GUILD_IDS.split(",").map(id => id.trim()));
  const timestamp = Date.now();
  const lastImport = await db.getLastImport();
  const stats: Record<string, any> = {
    totalMessages: 0,
    totalLinks: 0,
    totalChannels: 0,
    channelMessages: {}
  };

  if (!existsSync("./export")) mkdirSync("./export");
  writeFileSync(
    `./export/links-${timestamp}.json`,
    `{ "timestamp": ${timestamp}, "links": [`,
    "utf-8"
  );

  const channels = Array.from(discordClient.channels.cache.values()).filter(
    channel => channel.type === ChannelType.GuildText
  );
  if (channels.length === 0) return;
  stats.totalChannels = channels.length;

  for (const channel of channels) {
    if (excludedGuilds.has(channel.guildId)) continue;
    console.log(`Processing channel: ${channel.name}`);
    let messageCount = 0;

    let message = await channel.messages
      .fetch({ limit: 1 })
      .then(messagePage => (messagePage.size === 1 ? messagePage.at(0) : null));

    while (message && messageCount < MAX_MESSAGES) {
      if (lastImport && message.createdTimestamp < lastImport) break;
      const messagePage = await channel.messages.fetch({ limit: 100, before: message.id });
      messageCount += messagePage.size;

      for (const fetchedMessage of messagePage.values()) {
        if (lastImport && fetchedMessage.createdTimestamp < lastImport) break;
        if (fetchedMessage.author.bot) continue;
        const links = await getLinks(fetchedMessage);
        if (links.length === 0) continue;
        appendFileSync(
          `./export/links-${timestamp}.json`,
          `${isFirstWrite ? "" : ",\n"}${JSON.stringify(links).slice(1, -1)}`,
          "utf-8"
        );
        stats.totalLinks += links.length;
        isFirstWrite = false;
      }

      console.log(`Channel ${channel.name} | Fetched ${messageCount} messages`);
      message = 0 < messagePage.size ? messagePage.at(messagePage.size - 1) : null;
    }

    stats.channelMessages[channel.name] = messageCount;
    stats.totalMessages += messageCount;
  }

  appendFileSync(`./export/links-${timestamp}.json`, "]}", "utf-8");
  await db.recordImport(timestamp);

  const existingStats = JSON.parse(readFileSync("./stats/get-links.json", "utf-8"));
  writeFileSync(
    "./stats/get-links.json",
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

  process.exit();
});

discordClient.login(DISCORD_TOKEN);
