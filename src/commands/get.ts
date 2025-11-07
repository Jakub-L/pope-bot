import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import { Database, popeGet } from "../utils";

const get = {
  data: new SlashCommandBuilder().setName("get").setDescription("Chwyta papieża!"),
  async execute(interaction: ChatInputCommandInteraction, db: Database) {
    await popeGet(interaction, db);
  }
};

export default get;
