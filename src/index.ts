import "dotenv/config";
import { Client, Events, GatewayIntentBits } from "discord.js";

import { Database, getLinks, getReply, getUpdate } from "./utils";

const { DISCORD_TOKEN } = process.env;

const db = new Database();
const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages
  ]
});

discordClient.on(Events.MessageCreate, async message => {
  if (message.author.bot) return;

  const links = getLinks(message);
  if (links.length === 0) return;

  for (const link of links) {
    const update = await getUpdate(link);
    if (update) {
      const images = await db.getImages({
        phash: update.phash,
        guild_id: message.guild?.id || "0"
      });

      if (images.length > 0) {
        message.reply({
          content: getReply(images[0])
        });
        await db.updateImage(update);
      } else await db.addImage(update);
    }
  }
});

discordClient.login(DISCORD_TOKEN);
