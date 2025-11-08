import "dotenv/config";
import { Client, Collection, Events, GatewayIntentBits } from "discord.js";

import commands from "./commands";
import { Database, getLinks, getReply, getUpdate, PhashIndex } from "./utils";
import { ImageUpdate } from "./types";
import { groupSimilarImages } from "./utils/phash-index";
import { log } from "./utils/log";
import { isMessagePopeGet, popeGet } from "./utils/pope-get";

// TYPES
type ClientWithCommands = Client & { commands: Collection<string, any> };

// CONSTANTS & GLOBAL VARIABLES
const {
  DISCORD_TOKEN,
  DISCORD_EXCLUDED_USER_IDS = "",
  DISCORD_EXCLUDED_GUILD_IDS = "",
  DISCORD_WELCOME_CHANNEL_ID = ""
} = process.env;
const excludedUsers = new Set(DISCORD_EXCLUDED_USER_IDS.split(",").map(id => id.trim()));
const excludedGuilds = new Set(DISCORD_EXCLUDED_GUILD_IDS.split(",").map(id => id.trim()));

// INITIALISE CLIENTS
const db = new Database();
const searchIndex = new PhashIndex();
const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages
  ]
}) as ClientWithCommands;

// REGISTER COMMANDS
discordClient.commands = new Collection();
for (const command of commands) {
  discordClient.commands.set(command.data.name, command);
}

// HANDLERS
discordClient.once(Events.ClientReady, async () => {
  log(`Logged in as ${discordClient.user?.tag}`);
  log("Initialising index...");
  const phashes = await db.getImages(["phash"]);
  for (const image of phashes) searchIndex.add(image.phash);
  log(`Index initialised with ${phashes.length} images.`);
  log("Bot ready.");
  if (DISCORD_WELCOME_CHANNEL_ID) {
    const channel = discordClient.channels.cache.get(DISCORD_WELCOME_CHANNEL_ID);
    if (channel?.isTextBased() && channel?.isSendable()) {
      channel.send(
        `<:antypapaj:885248251274592356> Lękajcie się! Wróciłem po restarcie. Indeksuję ${phashes.length} obrazków.`
      );
    }
  }
});

discordClient.on(Events.MessageCreate, async message => {
  if (message.author.bot) return;
  if (excludedGuilds.has(message.guildId ?? "")) return;

  log(`Message from ${message.author.tag}`);
  log(
    `Message content: ${
      message.content.length > 50
        ? message.content.slice(0, 50) + "..."
        : message.content || "No content"
    }`
  );

  // Pope get check
  if (isMessagePopeGet(message)) {
    await popeGet(message, db);
  }

  // Image repost check
  const replies = [];
  const links = getLinks(message);
  log(`Found ${Object.values(links).length} links in the message.`);
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
});

discordClient.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = (interaction.client as ClientWithCommands).commands.get(interaction.commandName);
  if (!command) return;
  await command.execute(interaction, db);
});

discordClient.login(DISCORD_TOKEN);
