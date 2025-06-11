import "dotenv/config";
import { Client, Events, GatewayIntentBits } from "discord.js";
import phash from "sharp-phash";

import { DatabaseConnection, getReply } from "./utils";

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

  if (links.size === 0) return;

  for (const link of links) {
    const response = await fetch(link, { method: "GET" });
    const isImage = response.headers.get("content-type")?.startsWith("image/");
    if (isImage) {
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const phashValue = await phash(buffer);

      const images = await database.getImagesByPhash(phashValue);
      if (images.length > 0) message.reply({ content: getReply(images) });

      await database.addImage({
        id: crypto.randomUUID(),
        phash: phashValue,
        user_name: author.globalName || author.username,
        guild_id: message.guild?.id || "0",
        channel_id: message.channel.id,
        message_id: message.id,
        timestamp: Date.now()
      });
    }
  }
});

discordClient.login(DISCORD_TOKEN);
