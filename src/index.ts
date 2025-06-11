import "dotenv/config";
import { Client, Events, GatewayIntentBits } from "discord.js";
import phash from "sharp-phash";

import { DatabaseConnection } from "./utils/database";
import type { Image } from "./types";

const { DISCORD_TOKEN } = process.env;

const database = new DatabaseConnection();
const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages
  ]
});

const getLinkToMessage = (image: Image): string => {
  return `https://discord.com/channels/${image.guild_id}/${image.channel_id}/${image.message_id}`;
};

const getFormattedDateTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return `${date.toLocaleDateString("pl-PL")} o ${date.toLocaleTimeString("pl-PL")}`;
};

const getReply = (images: Image[]): string => {
  const firstPost = images[images.length - 1];
  const lastPost = images[0];
  const count = images.length;

  const salutation = "O ty psotniku!";
  const countMessage = `Już to widziałem ${count} ${count === 0 ? "raz" : "razy"}!`;
  const firstSeen = `Najpierw zapostował to ${firstPost.user_name} ${getFormattedDateTime(
    firstPost.timestamp
  )}: [ [tutaj](${getLinkToMessage(firstPost)}) ].`;
  const lastSeen = count > 0 ? `A ostatnio ${lastPost.user_name}.` : "";

  return [salutation, countMessage, firstSeen, lastSeen].join(" ").trim();
};

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
