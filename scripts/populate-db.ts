import "dotenv/config";
import { ChannelType, Client, Events, GatewayIntentBits } from "discord.js";
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

discordClient.once(Events.ClientReady, async () => {
  const channels = Array.from(discordClient.channels.cache.values())
    .filter(channel => channel.type === ChannelType.GuildText)
    .map(channel => ({
      id: channel.id,
      guildId: channel.guildId,
      name: channel.name
    }));

  if (channels.length === 0) return;
  console.log(`Found ${channels.length} channels.`);
  await db.deleteAllImages();
  console.log("Cleared existing images from the database.");
  console.log("Getting messages:");

  for (const channel of channels) {
    console.log(channel.name);
  }
  process.exit(0);
});

discordClient.login(DISCORD_TOKEN);
