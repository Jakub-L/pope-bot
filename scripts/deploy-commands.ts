import "dotenv/config";
import { REST, Routes } from "discord.js";

import commands from "../src/commands";

const {
  DISCORD_APPLICATION_ID = "",
  DISCORD_TOKEN = "",
  DISCORD_TEST_GUILD_ID = ""
} = process.env;

const rest = new REST().setToken(DISCORD_TOKEN);
const commandJson = commands.map(command => command.data.toJSON());

const deployCommands = async () => {
  await rest.put(
    Routes.applicationGuildCommands(DISCORD_APPLICATION_ID, DISCORD_TEST_GUILD_ID),
    {
      body: commandJson
    }
  );
};

deployCommands();
