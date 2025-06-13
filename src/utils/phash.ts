import phash from "sharp-phash";
import { ImageUpdate, Link } from "../types";

export const getUpdate = async (link: Link): Promise<ImageUpdate | null> => {
  const response = await fetch(link.url, { method: "GET" });
  const isImage = response.headers.get("content-type")?.startsWith("image/");
  if (!isImage) return null;

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return {
    phash: await phash(buffer),
    guild_id: link.guild_id,
    user_name: link.user_name,
    channel_id: link.channel_id,
    message_id: link.message_id,
    timestamp: link.timestamp
  };
};
