import "dotenv/config";
import { Client, Events, GatewayIntentBits } from "discord.js";

import { Database, getLinks, getPhash, getReply } from "./utils";

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
  if (links.size === 0) return;

  for (const link of links) {
    const phash = await getPhash(link);
    if (phash) {
      const images = await db.getImages({
        phash,
        guild_id: message.guild?.id || "0"
      });

      const update = {
        phash,
        guild_id: message.guild?.id || "0",
        user_name: message.author.globalName || message.author.username,
        channel_id: message.channel.id,
        message_id: message.id,
        timestamp: Date.now()
      };

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
