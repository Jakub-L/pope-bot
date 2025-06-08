import "dotenv/config";
import { Client, Events, GatewayIntentBits } from "discord.js";
import { DatabaseConnection } from "./utils/database";

const { DISCORD_TOKEN } = process.env;

const database = new DatabaseConnection();
const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages
  ]
});

discordClient.once(Events.ClientReady, async (readyClient: Client) => {
  console.log(`Ready! Logged in as ${readyClient.user?.tag}`);
  console.log(await database.getRecentImages());
});

discordClient.on(Events.MessageCreate, async message => {
  console.log(message.attachments);
  console.log(message.embeds);
});

discordClient.login(DISCORD_TOKEN);
