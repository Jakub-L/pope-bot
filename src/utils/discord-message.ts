import type { Image } from "../types";
import { formatDiff } from "./datetime";

export const getLinkToMessage = (image: Image): string => {
  return `https://discord.com/channels/${image.guild_id}/${image.channel_id}/${image.message_id}`;
};

export const getReply = (images: Image[]): string => {
  const lastPost = images[images.length - 1];
  const firstPost = images[0];
  const count = images.length;

  const salutation = "O ty psotniku!";
  const countMessage = `Już to widziałem ${count} ${count === 1 ? "raz" : "razy"}!`;
  const firstSeen = `Najpierw zapostował to ${firstPost.user_name} ${formatDiff(
    firstPost.timestamp
  )} [tutaj](${getLinkToMessage(firstPost)}).`;
  const lastSeen =
    count > 1
      ? `A ostatnio ${lastPost.user_name} ${formatDiff(lastPost.timestamp)}.`
      : "";

  return [salutation, countMessage, firstSeen, lastSeen].join(" ").trim();
};
