import "dotenv/config";
import { Cloudflare } from "cloudflare";
import { Client, Events, GatewayIntentBits } from "discord.js";

const { CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, DISCORD_TOKEN } = process.env;

const cloudflareClient = new Cloudflare({
  apiToken: CLOUDFLARE_API_TOKEN
});
const discordClient = new Client({ intents: [GatewayIntentBits.Guilds] });

discordClient.once(Events.ClientReady, async (readyClient: Client) => {
  console.log(`Ready! Logged in as ${readyClient.user?.tag}`);
  console.log(await cloudflareClient.d1.database.list({ account_id: CLOUDFLARE_ACCOUNT_ID! }));
});

discordClient.login(DISCORD_TOKEN);
