import "dotenv/config";
import { Client, Events, GatewayIntentBits } from "discord.js";

import { Database, getLinks, getReply, getUpdate } from "./utils";

const {
  DISCORD_TOKEN,
  DISCORD_EXCLUDED_USER_IDS = "",
  DISCORD_EXCLUDED_GUILD_IDS = ""
} = process.env;

const db = new Database();
const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages
  ]
});

const excludedUsers = new Set(DISCORD_EXCLUDED_USER_IDS.split(",").map(id => id.trim()));
const excludedGuilds = new Set(DISCORD_EXCLUDED_GUILD_IDS.split(",").map(id => id.trim()));

discordClient.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${discordClient.user?.tag}`);
});

discordClient.on(Events.MessageCreate, async message => {
  if (message.author.bot) return;
  if (excludedGuilds.has(message.guildId ?? "")) return;

  console.log(`\nHandling message from ${message.author.tag}`);

  const links = getLinks(message);
  if (links.length === 0) return;

  console.log(`Found ${links.length} links in the message.`);

  for (const link of links) {
    const update = await getUpdate(link);
    if (update) {
      const image = await db.addImage(update);
      console.log("Added image to database");
      if (image.count > 1) {
        console.log(`Image already exists, count: ${image.count}`);
        message.reply({ content: getReply(image, excludedUsers.has(message.author.id)) });
      }
    }
  }
});

discordClient.login(DISCORD_TOKEN);
