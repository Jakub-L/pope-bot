import { existsSync, mkdirSync, appendFileSync, writeFileSync } from "fs";
import "dotenv/config";
import { ChannelType, Client, Events, GatewayIntentBits, TextChannel } from "discord.js";


type UserStats = {
  userId: string;
  username: string;
  globalName: string;
  totalMessages: number;
  postsPerChannel: Record<string, number>;
  postTimes: number[];
  totalMessageLength: number;
  reactions: Record<string, number>;
};

const { DISCORD_TOKEN, DISCORD_EXCLUDED_GUILD_IDS = "" } = process.env;

const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages
  ]
});

const timestamp = Date.now();

const processChannel = async (channel: TextChannel, stats: Record<string, UserStats>) => {
  console.log(`Processing channel: ${channel.name}`);
  let messageCount = 0;

  let message = await channel.messages
    .fetch({ limit: 1 })
    .then((messagePage: any) => (messagePage.size === 1 ? messagePage.at(0) : null));

  while (message) {
    const messagePage = await channel.messages.fetch({ limit: 100, before: message.id });
    messageCount += messagePage.size;

    for (const fetchedMessage of messagePage.values()) {
      if (fetchedMessage.author.bot) continue;
      const userId = fetchedMessage.author.id;
      if (!(userId in stats)) {
        stats[userId] = {
          userId,
          username: fetchedMessage.author.username,
          globalName: fetchedMessage.author.globalName || "",
          totalMessages: 0,
          postsPerChannel: {},
          postTimes: [],
          totalMessageLength: 0,
          reactions: {}
        };
      }
      stats[userId].totalMessages += 1;
      stats[userId].totalMessageLength += fetchedMessage.content.length;
      stats[userId].postsPerChannel[channel.name] =
        (stats[userId].postsPerChannel[channel.name] || 0) + 1;
      stats[userId].postTimes.push(fetchedMessage.createdTimestamp);
      for (const reaction of fetchedMessage.reactions.cache.values()) {
        const reactionId = `${reaction.emoji.id}-${reaction.emoji.name}`;
        stats[userId].reactions[reactionId] =
          (stats[userId].reactions[reactionId] || 0) + reaction.count;
      }
    }

    console.log(`Channel ${channel.name} | Fetched ${messageCount} messages`);
    message = 0 < messagePage.size ? messagePage.at(messagePage.size - 1) : null;
  }
};

discordClient.once(Events.ClientReady, async () => {
  const excludedGuilds = new Set(DISCORD_EXCLUDED_GUILD_IDS.split(",").map(id => id.trim()));
  const stats: Record<string, UserStats> = {};

  if (!existsSync("./export")) mkdirSync("./export");
  writeFileSync(
    `./export/user-stats-${timestamp}.json`,
    `{ "timestamp": ${timestamp}, "stats": `,
    "utf-8"
  );

  const channels = Array.from(discordClient.channels.cache.values())
    .filter(channel => channel.type === ChannelType.GuildText)
    .filter(channel => !excludedGuilds.has(channel.guildId)) as TextChannel[];
  if (channels.length === 0) return;

  await Promise.all(channels.map(channel => processChannel(channel, stats)));

  appendFileSync(`./export/user-stats-${timestamp}.json`, JSON.stringify(stats), "utf-8");
  appendFileSync(`./export/user-stats-${timestamp}.json`, "}", "utf-8");

  process.exit();
});

discordClient.login(DISCORD_TOKEN);
