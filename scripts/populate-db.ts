import "dotenv/config";
import {
  ChannelType,
  Client,
  Events,
  GatewayIntentBits,
  GuildTextBasedChannel
} from "discord.js";

import { Database, getLinks, getUpdate } from "../src/utils";
import type { ImageUpdate, Link } from "../src/types";

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
  maxMessages: number = 10_000
): Promise<Link[]> => {
  let links: Link[] = [];
  let messageCount = 0;

  let message = await channel.messages
    .fetch({ limit: 1 })
    .then(messagePage => (messagePage.size === 1 ? messagePage.at(0) : null));

  while (message && messageCount < maxMessages) {
    const messagePage = await channel.messages.fetch({ limit: 100, before: message.id });
    messageCount += messagePage.size;
    console.log(`Channel ${channel.name} | Fetched ${messageCount} messages`);

    for (const message of messagePage.values()) {
      links = links.concat(Array.from(getLinks(message)));
    }
    message = 0 < messagePage.size ? messagePage.at(messagePage.size - 1) : null;
  }

  return Object.values(
    links.reduce(
      (acc, link) => ({ ...acc, [`${link.url}-${link.message_id}`]: link }),
      {} as Record<string, Link>
    )
  );
};

discordClient.once(Events.ClientReady, async () => {
  const channels = Array.from(discordClient.channels.cache.values()).filter(
    channel => channel.type === ChannelType.GuildText
  );
  if (channels.length === 0) return;
  console.log(`Found ${channels.length} channels.`);

  await db.deleteAllImages();
  console.log("Cleared existing images from the database.");

  let links: Link[] = [];
  for (const channel of channels) {
    const channelLinks = await fetchAllLinks(channel as GuildTextBasedChannel);
    links = [...links, ...channelLinks];
    console.log(`Found ${channelLinks.length} links in channel ${channel.name}.`);
    // console.log(links);
  }
  console.log(`Total links found: ${links.length}`);

  const updates: ImageUpdate[] = [];
  for (let i = 0; i < links.length; i++) {
    if (i > 0 && i % 100 === 0) console.log(`Processed ${i} links...`);
    const link = links[i];
    const update = await getUpdate(link);
    if (update) updates.push(update);
  }
  console.log(`Total updates to process: ${updates.length}`);

  for (let i = 0; i < updates.length; i++) {
    if (i > 0 && i % 100 === 0) console.log(`Processed ${i} updates...`);
    const update = updates[i];
    const images = await db.getImages({
      phash: update.phash,
      guild_id: update.guild_id
    });

    if (images.length > 0) await db.updateImage(update);
    else await db.addImage(update);
  }
  console.log("Database populated with new images.");
  process.exit();
});

discordClient.login(DISCORD_TOKEN);
