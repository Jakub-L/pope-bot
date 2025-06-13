import { Message } from "discord.js";
import { formatDiff } from "./datetime";
import type { Image, Link } from "../types";
import salutations from "../data/salutations.json";

const randomSelection = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

export const getReply = (image: Image): string => {
  const {
    count,
    guild_id,
    first_post_user_name,
    first_post_timestamp,
    first_post_channel_id,
    first_post_message_id,
    last_post_user_name,
    last_post_timestamp
  } = image;
  const link = `https://discord.com/channels/${guild_id}/${first_post_channel_id}/${first_post_message_id}`;

  const salutation = randomSelection(salutations);
  const countMessage = `Już to widziałem ${count} ${count === 1 ? "raz" : "razy"}!`;
  const firstSeen = `Najpierw zapostował to ${first_post_user_name} ${formatDiff(
    first_post_timestamp
  )} [tutaj](${link}).`;
  const lastSeen =
    count > 1 ? `A ostatnio ${last_post_user_name} ${formatDiff(last_post_timestamp)}.` : "";

  return [salutation, countMessage, firstSeen, lastSeen].join(" ").trim();
};

export const getLinks = (message: Message): Link[] => {
  const { content, embeds, attachments, author } = message;

  return [
    ...embeds.map(embed => embed.url).filter(url => url !== null),
    ...attachments.map(attachment => attachment.url).filter(Boolean),
    ...(content.match(/https?:\/\/[^\s]+/g) || [])
  ].map(
    url =>
      ({
        url,
        guild_id: message.channelId,
        user_name: author.globalName || author.username,
        channel_id: message.channelId,
        message_id: message.id,
        timestamp: message.createdTimestamp
      } as Link)
  );
};
