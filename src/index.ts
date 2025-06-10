import "dotenv/config";
import { Client, Events, GatewayIntentBits } from "discord.js";
import { DatabaseConnection } from "./utils/database";

const { DISCORD_TOKEN } = process.env;

const database = new DatabaseConnection();
const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages
  ]
});

discordClient.on(Events.MessageCreate, async message => {
  const { content, embeds, attachments, author } = message;
  if (author.bot) return;

  const links: Set<string> = new Set([
    ...embeds.map(embed => embed.url).filter(url => url !== null),
    ...attachments.map(attachment => attachment.url).filter(Boolean),
    ...(content.match(/https?:\/\/[^\s]+/g) || [])
  ]);

  console.log(`Received message from ${author.tag}: ${Array.from(links).join(", ")}`);
});

discordClient.login(DISCORD_TOKEN);
