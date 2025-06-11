import type { Image } from "../types";

export const getLinkToMessage = (image: Image): string => {
  return `https://discord.com/channels/${image.guild_id}/${image.channel_id}/${image.message_id}`;
};

export const getReply = (images: Image[]): string => {
  const firstPost = images[images.length - 1];
  const lastPost = images[0];
  const count = images.length;

  const salutation = "O ty psotniku!";
  const countMessage = `Już to widziałem ${count} ${count === 0 ? "raz" : "razy"}!`;
  const firstSeen = `Najpierw zapostował to ${
    firstPost.user_name
  }: [ [tutaj](${getLinkToMessage(firstPost)}) ].`;
  const lastSeen = count > 0 ? `A ostatnio ${lastPost.user_name}.` : "";

  return [salutation, countMessage, firstSeen, lastSeen].join(" ").trim();
};
