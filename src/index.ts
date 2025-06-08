import "dotenv/config";
import { Client, Events, GatewayIntentBits } from "discord.js";

const { DISCORD_TOKEN } = process.env;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (readyClient: Client) => {
  console.log(`Ready! Logged in as ${readyClient.user?.tag}`);
});

client.login(DISCORD_TOKEN);
