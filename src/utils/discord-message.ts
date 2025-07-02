import { Message } from "discord.js";
import { formatDiff } from "./datetime";
import type { Image, Link, SimilarHashes } from "../types";
import salutations from "../data/salutations.json";

const randomSelection = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

const getSingleImageReply = (image: Image): string => {
  const {
    first_post_user_name,
    first_post_channel_id,
    first_post_message_id,
    first_post_timestamp,
    count
  } = image;
  console.log("getSingleImageReply", { image });
  const link = `https://discord.com/channels/${image.guild_id}/${first_post_channel_id}/${first_post_message_id}`;
  return `${count} raz${
    count === 1 ? "" : "y"
  }. Najpierw zapostował/a go ${first_post_user_name} ${formatDiff(
    first_post_timestamp
  )}: ${link}`;
};

const getGroupedImagesReply = (title: string, images: Image[]): string => {
  if (images.length === 0) return "";
  const imageReplies = images.map(getSingleImageReply);
  if (imageReplies.length === 1) return `${title}! ${imageReplies[0]}`;
  return `${title}:\n${imageReplies.map(reply => `- ${reply}`).join("\n")}`;
};

export const getReply = (
  similarImages: Record<string, Image>,
  groupedHashes: SimilarHashes,
  isExcluded: boolean
): string => {
  const salutation = randomSelection(salutations);
  if (isExcluded) return `${salutation} Już to widzi-- a przepraszam, tobie wolno.`;

  const groupedImages: Record<string, Image[]> = Object.entries(groupedHashes).reduce(
    (acc, [key, hashes]) => ({ ...acc, [key]: hashes.map(hash => similarImages[hash]) }),
    {}
  );

  const exactMessage = getGroupedImagesReply(
    "Widziałem **dokładnie ten** obrazek",
    groupedImages.exact
  );
  const closeMessage = getGroupedImagesReply(
    "Widziałem też **bardzo podobne** obrazki",
    groupedImages.close
  );
  const similarMessage = getGroupedImagesReply(
    "I nawet takie, które są **całkiem podobne**",
    groupedImages.similar
  );

  return [salutation, exactMessage, closeMessage, similarMessage]
    .filter(text => text.length > 0)
    .join("\n\n");
};

export const getLinks = (message: Message): Link[] => {
  const { content, embeds, attachments, author } = message;

  return Array.from(
    new Set([
      ...embeds.map(embed => embed.url).filter(url => url !== null),
      ...attachments.map(attachment => attachment.url).filter(Boolean),
      ...(content.match(/https?:\/\/[^\s]+/g) || [])
    ])
  ).map(
    url =>
      ({
        url,
        guild_id: message.guildId,
        user_name: author.globalName || author.username,
        channel_id: message.channelId,
        message_id: message.id,
        timestamp: message.createdTimestamp
      } as Link)
  );
};
