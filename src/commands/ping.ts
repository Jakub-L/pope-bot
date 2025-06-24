import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";

import { formatUptime } from "../utils";

const ping = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Sprawdza, czy Papieżbot jest aktywny."),
  async execute(interaction: ChatInputCommandInteraction) {
    const { uptime } = interaction.client;

    interaction.reply({
      content: `Papieżbot inwigiluje serwer! Czuwam już ${formatUptime(uptime)}.`,
      flags: MessageFlags.Ephemeral
    });
  }
};

export default ping;
