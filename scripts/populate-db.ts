import "dotenv/config";
import {
  ChannelType,
  Client,
  Events,
  GatewayIntentBits,
  GuildTextBasedChannel
} from "discord.js";
import phash from "sharp-phash";

import { Database } from "../src/utils";

const { DISCORD_TOKEN } = process.env;

const db = new Database();
const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages
  ]
});

const fetchAllLinks = async (
  channel: GuildTextBasedChannel,
  maxMessages: number = 5_000
): Promise<string[]> => {
  let links: Set<string> = new Set();
  let messageCount = 0;

  // Create message pointer
  let message = await channel.messages
    .fetch({ limit: 1 })
    .then(messagePage => (messagePage.size === 1 ? messagePage.at(0) : null));

  while (message && messageCount < maxMessages) {
    const messagePage = await channel.messages.fetch({ limit: 100, before: message.id });
    messageCount += messagePage.size;
    console.log(`Channel ${channel.name} | Fetched ${messageCount} messages`);

    for (const message of messagePage.values()) {
      const { content, embeds, attachments } = message;
      links = links.union(
        new Set([
          ...embeds.map(embed => embed.url).filter(url => url !== null),
          ...attachments.map(attachment => attachment.url).filter(Boolean),
          ...(content.match(/https?:\/\/[^\s]+/g) || [])
        ])
      );
    }

    // Update our message pointer to be the last message on the page of messages
    message = 0 < messagePage.size ? messagePage.at(messagePage.size - 1) : null;
  }

  return Array.from(links);
};

discordClient.once(Events.ClientReady, async () => {
  const channels = Array.from(discordClient.channels.cache.values()).filter(
    channel => channel.type === ChannelType.GuildText
  );

  if (channels.length === 0) return;
  console.log(`Found ${channels.length} channels.`);
  await db.deleteAllImages();
  console.log("Cleared existing images from the database.");

  for (const channel of channels.slice(0, 10)) {
    const links = await fetchAllLinks(channel as GuildTextBasedChannel);
    console.log(`Found ${links.length} links in channel ${channel.name}.`);
  }
  process.exit(0);
});

discordClient.login(DISCORD_TOKEN);
