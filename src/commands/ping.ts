import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";

const ping = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Sprawdza, czy Papieżbot jest aktywny."),
  async exectue(interaction: ChatInputCommandInteraction) {
    interaction.reply({
      content: "Papieżbot jest aktywny!",
      flags: MessageFlags.Ephemeral
    });
  }
};

export default ping;
