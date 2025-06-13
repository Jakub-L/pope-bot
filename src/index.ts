import "dotenv/config";
import { Client, Events, GatewayIntentBits } from "discord.js";
import phash from "sharp-phash";

import { Database, getLinks, getReply } from "./utils";

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
    const response = await fetch(link, { method: "GET" });
    const isImage = response.headers.get("content-type")?.startsWith("image/");
    if (isImage) {
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const phashValue = await phash(buffer);

      const images = await db.getImages({
        phash: phashValue,
        guild_id: message.guild?.id || "0"
      });

      const update = {
        phash: phashValue,
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
