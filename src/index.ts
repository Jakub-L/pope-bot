import "dotenv/config";
import { Client, Collection, Events, GatewayIntentBits } from "discord.js";

import commands from "./commands";
import { Database, getLinks, getReply, getUpdate, PhashIndex } from "./utils";
import { ImageUpdate } from "./types";
import { groupSimilarImages } from "./utils/phash-index";

// TYPES
type ClientWithCommands = Client & { commands: Collection<string, any> };

// CONSTANTS & GLOBAL VARIABLES
const {
  DISCORD_TOKEN,
  DISCORD_EXCLUDED_USER_IDS = "",
  DISCORD_EXCLUDED_GUILD_IDS = ""
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
  console.log(`Logged in as ${discordClient.user?.tag}`);
  console.log("Initialising index...");
  const phashes = await db.getImages(["phash"]);
  for (const image of phashes) searchIndex.add(image.phash);
  console.log(`Index initialised with ${phashes.length} images.`);
  console.log("Bot ready.");
});

discordClient.on(Events.MessageCreate, async message => {
  if (message.author.bot) return;
  if (excludedGuilds.has(message.guildId ?? "")) return;

  console.log(`\n${new Date().toISOString()} | Message from ${message.author.tag}`);
  console.log(
    `\t${
      message.content.length > 50
        ? message.content.slice(0, 50) + "..."
        : message.content || "No content"
    }`
  );

  const replies = [];
  const links = getLinks(message);
  const updates: Record<string, ImageUpdate> = {};
  for (const link of links) {
    const update = await getUpdate(link);
    if (update) updates[update.phash] = update;
  }

  if (Object.values(updates).length === 0) return;
  console.log(`\tFound ${Object.values(updates).length} updates in the message.`);

  for (const update of Object.values(updates)) {
    const similarHashes = searchIndex.findSimilar(update.phash, 8);
    if (similarHashes.length === 0) continue;

    const groupedHashes = groupSimilarImages(similarHashes);
    const similarImages = (
      await db.getImages(["*"], {
        phash: similarHashes.map(result => result.hex)
      })
    ).reduce((acc, image) => ({ ...acc, [image.phash]: image }), {});

    replies.push(getReply(similarImages, groupedHashes, excludedUsers.has(message.author.id)));
    searchIndex.add(update.phash);
    await db.addImage(update);
  }

  if (replies.length > 0) {
    message.reply({
      content: replies.join("\n——————————————————\n")
    });
  }
});

discordClient.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = (interaction.client as ClientWithCommands).commands.get(
    interaction.commandName
  );
  if (!command) return;
  await command.execute(interaction);
});

discordClient.login(DISCORD_TOKEN);
