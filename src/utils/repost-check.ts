import { Message, OmitPartialGroupDMChannel } from "discord.js";

import { ImageUpdate, Link } from "../types";
import { Database } from "./database";
import { getReply } from "./discord-message";
import { log } from "./log";
import { getUpdate } from "./phash";
import { groupSimilarImages, PhashIndex } from "./phash-index";

type RepostCheckParams = {
  message: OmitPartialGroupDMChannel<Message<boolean>>;
  links: Link[];
  db: Database;
  searchIndex: PhashIndex;
  excludedUsers: Set<string>;
};

export const checkReposts = async ({
  message,
  links,
  db,
  searchIndex,
  excludedUsers
}: RepostCheckParams) => {
  const replies: string[] = [];
  const updates: Record<string, ImageUpdate> = {};

  for (const link of links) {
    const update = await getUpdate(link);
    if (update) updates[update.phash] = update;
  }

  if (Object.values(updates).length === 0) return;
  log(`Found ${Object.values(updates).length} updates in the message.`);

  let similarImageCount = 0;
  for (const update of Object.values(updates)) {
    const similarHashes = searchIndex.findSimilar(update.phash, 8);
    await db.addImage(update);
    if (similarHashes.length === 0) continue;

    const groupedHashes = groupSimilarImages(similarHashes);
    const similarImages = (
      await db.getImages(["*"], {
        phash: similarHashes.map(result => result.hex)
      })
    ).reduce((acc, image) => ({ ...acc, [image.phash]: image }), {});

    similarImageCount += Object.keys(similarImages).length;

    replies.push(
      getReply({
        similarImages,
        groupedHashes,
        excludedUsers,
        authorId: message.author.id
      })
    );
    searchIndex.add(update.phash);
  }

  log(`Found ${similarImageCount} similar images.`);

  if (replies.length > 0) {
    message.reply({
      content: replies.join("\n——————————————————\n")
    });
  }
};

