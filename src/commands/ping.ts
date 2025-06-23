import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

const ping = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Sprawdza, czy Papieżbot jest aktywny."),
  async exectue(interaction: ChatInputCommandInteraction) {
    interaction.reply({
      content: "Papieżbot jest aktywny!"
    });
  }
};

export default ping;