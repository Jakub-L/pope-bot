import { Message, OmitPartialGroupDMChannel } from "discord.js";

import { ImageUpdate, Link } from "../types";
import { Database } from "./database";
import { getReply } from "./discord-message";
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

  for (const update of Object.values(updates)) {
    const similarHashes = searchIndex.findSimilar(update.phash, 8);
    const image = await db.addImage(update);
    if (!image) {
      await message.reply({
        content:
          "Coś się popsuło i nie dałem rady zapisać obrazka w mojej bazie danych. Jeśli to był repost, to tym razem uszło ci na sucho!"
      });
      continue;
    }

    searchIndex.add(update.phash);
    if (similarHashes.length === 0) continue;

    const groupedHashes = groupSimilarImages(similarHashes);
    const fetchedImages = await db.getImages(["*"], {
      phash: similarHashes.map(result => result.hex)
    });
    if (!fetchedImages || fetchedImages.length === 0) {
      await message.reply({
        content:
          "Znalazłem reposty, ale nie udało mi się pobrać ich z bazy danych. Uszło ci na sucho, szczęściarzu!"
      });
      searchIndex.add(update.phash);
      continue;
    }
    const similarImages = fetchedImages.reduce(
      (acc, image) => ({ ...acc, [image.phash]: image }),
      {}
    );

    replies.push(
      getReply({
        similarImages,
        groupedHashes,
        excludedUsers,
        authorId: message.author.id
      })
    );
  }

  if (replies.length > 0) {
    message.reply({
      content: replies.join("\n——————————————————\n")
    });
  }
};
