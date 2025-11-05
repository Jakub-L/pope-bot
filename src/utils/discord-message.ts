import { Message } from "discord.js";
import { formatDiff } from "./datetime";
import type { Image, Link, SimilarHashes } from "../types";
import salutations from "../data/salutations.json";

const isNonNullString = (value: string | null | undefined): value is string =>
  typeof value === "string";

const randomSelection = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

const getSingleImageReply = (image: Image, isListElement: boolean): string => {
  const {
    first_post_user_name,
    first_post_channel_id,
    first_post_message_id,
    first_post_timestamp,
    count
  } = image;
  const link = `https://discord.com/channels/${image.guild_id}/${first_post_channel_id}/${first_post_message_id}`;
  const countText = count === 1 ? "raz" : `${count} razy`;
  const timeText = formatDiff(first_post_timestamp);

  if (isListElement)
    return `- ${link} (${countText}). Najpierw zapostował/a go ${first_post_user_name} ${timeText}`;
  return `${countText}. Najpierw zapostował/a go ${first_post_user_name} ${timeText}: ${link}`;
};

const getGroupedImagesReply = (
  singularTitle: string,
  multipleTitle: string,
  images: Image[]
): string => {
  const imageReplies = images.map(image => getSingleImageReply(image, images.length > 1));

  if (imageReplies.length === 0) return "";
  if (imageReplies.length === 1) return `${singularTitle} ${imageReplies[0]}`;
  return `${multipleTitle}:\n${imageReplies.join("\n")}`;
};

interface GetReplyOptions {
  similarImages: Record<string, Image>;
  groupedHashes: SimilarHashes;
  authorId: string;
  authorName: string;
  excludedUsers: Set<string>;
}
export const getReply = (options: GetReplyOptions): string => {
  const { similarImages, groupedHashes, authorId, excludedUsers } = options;
  const salutation = randomSelection(salutations);
  const isExcluded = excludedUsers.has(authorId);

  if (isExcluded) return `${salutation} Już to widzi-- a przepraszam, tobie wolno.`;

  const groupedImages: Record<string, Image[]> = Object.entries(groupedHashes).reduce(
    (acc, [key, hashes]) => ({ ...acc, [key]: hashes.map(hash => similarImages[hash]) }),
    {}
  );

  const exactMessage = getGroupedImagesReply(
    "Widziałem **dokładnie ten** obrazek",
    "",
    groupedImages.exact
  );
  const closeMessage = getGroupedImagesReply(
    `Widziałem${exactMessage.length > 0 ? " też" : ""} **niemal identyczny** obrazek`,
    `Widziałem${exactMessage.length > 0 ? " też" : ""} **niemal identyczne** obrazki`,
    groupedImages.close
  );
  const similarMessage = getGroupedImagesReply(
    `${exactMessage.length > 0 || closeMessage.length > 0 ? "I nawet taki" : "Widziałem obrazek"}, które był **całkiem podobne**`,
    `${exactMessage.length > 0 || closeMessage.length > 0 ? "I nawet taki" : "Widziałem obrazki"}, które były **całkiem podobne**`,
    groupedImages.similar
  );

  return [salutation, exactMessage, closeMessage, similarMessage]
    .filter(text => text.length > 0)
    .join("\n");
};

export const getLinks = (message: Message): Link[] => {
  const { content, embeds, attachments, author } = message;

  return Array.from(
    new Set([
      ...embeds.map(embed => embed.url).filter(isNonNullString),
      ...attachments.map(attachment => attachment.url).filter(isNonNullString),
      ...(content.match(/https?:\/\/[^\s]+/g) || [])
    ])
  ).map(url => ({
    url,
    guild_id: message.guildId ?? "",
    user_name: author.globalName || author.username,
    channel_id: message.channelId,
    message_id: message.id,
    timestamp: message.createdTimestamp
  }));
};
