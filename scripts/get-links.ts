import { existsSync, mkdirSync, appendFileSync, writeFileSync, readFileSync } from "fs";
import "dotenv/config";
import { ChannelType, Client, Events, GatewayIntentBits, TextChannel } from "discord.js";

import { Database, getLinks } from "../src/utils";
import { Link } from "../src/types";

const { DISCORD_TOKEN, DISCORD_EXCLUDED_GUILD_IDS = "" } = process.env;
const MAX_MESSAGES = Infinity;
const BATCH_SIZE = 50;

const db = new Database();
const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages
  ]
});

const timestamp = Date.now();

const processChannel = async (
  channel: TextChannel,
  lastImport: number | null,
  stats: Record<string, any>
) => {
  console.log(`Processing channel: ${channel.name}`);
  let messageCount = 0;
  const links: Link[] = [];

  let message = await channel.messages
    .fetch({ limit: 1 })
    .then((messagePage: any) => (messagePage.size === 1 ? messagePage.at(0) : null));

  while (message && messageCount < MAX_MESSAGES) {
    if (lastImport && message.createdTimestamp < lastImport) break;
    const messagePage = await channel.messages.fetch({ limit: 100, before: message.id });
    messageCount += messagePage.size;

    for (const fetchedMessage of messagePage.values()) {
      if (lastImport && fetchedMessage.createdTimestamp < lastImport) break;
      if (fetchedMessage.author.bot) continue;
      const messageLinks = await getLinks(fetchedMessage);
      links.push(...messageLinks);
    }

    console.log(`Channel ${channel.name} | Fetched ${messageCount} messages`);
    message = 0 < messagePage.size ? messagePage.at(messagePage.size - 1) : null;
  }

  stats.channelMessages[channel.name] = messageCount;
  stats.totalMessages += messageCount;
  stats.totalLinks += links.length;
  return links;
};

discordClient.once(Events.ClientReady, async () => {
  const allLinks: Link[] = [];
  const excludedGuilds = new Set(DISCORD_EXCLUDED_GUILD_IDS.split(",").map(id => id.trim()));
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
    `{ "timestamp": ${timestamp}, "links": `,
    "utf-8"
  );

  const channels = Array.from(discordClient.channels.cache.values())
    .filter(channel => channel.type === ChannelType.GuildText)
    .filter(channel => !excludedGuilds.has(channel.guildId)) as TextChannel[];
  if (channels.length === 0) return;
  stats.totalChannels = channels.length;

  for (let i = 0; i < channels.length; i += BATCH_SIZE) {
    const batch = channels.slice(i, i + BATCH_SIZE);
    console.log(`Processing channels ${i + 1} to ${i + BATCH_SIZE}...`);

    const results = await Promise.all(
      batch.map(channel => processChannel(channel, lastImport, stats))
    );
    allLinks.push(...results.flat());
  }

  appendFileSync(`./export/links-${timestamp}.json`, JSON.stringify(allLinks), "utf-8");
  appendFileSync(`./export/links-${timestamp}.json`, "}", "utf-8");
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
