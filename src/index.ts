import "dotenv/config";
import { Client, Events, GatewayIntentBits } from "discord.js";

import { Database, getLinks, getReply, getUpdate } from "./utils";

const { DISCORD_TOKEN, DISCORD_EXCLUDED_USER_IDS = "" } = process.env;

const db = new Database();
const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages
  ]
});

const excludedUsers = new Set(DISCORD_EXCLUDED_USER_IDS.split(",").map(id => id.trim()));

discordClient.on(Events.MessageCreate, async message => {
  if (message.author.bot) return;

  const links = getLinks(message);
  if (links.length === 0) return;

  for (const link of links) {
    const update = await getUpdate(link);
    if (update) {
      const image = await db.addImage(update);
      if (image.count > 1) {
        message.reply({ content: getReply(image, excludedUsers.has(message.author.id)) });
      }
    }
  }
});

discordClient.login(DISCORD_TOKEN);
