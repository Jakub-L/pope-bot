import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import { PopeGet } from "../types";

import { Database } from "../utils";

const mapStatToMessage = (title: string, stats: PopeGet[]) => {
  if (stats.length === 0) return "";
  return [
    `## ${title}:`,
    ...stats.map(
      (stat, index) => `**${index + 1}.** ${stat.user_name} - ${stat.get_streak} getów`
    )
  ].join("\n");
};

const stats = {
  data: new SlashCommandBuilder()
    .setName("wyniki")
    .setDescription("Wypisuje aktualne wyniki papież-getów."),
  async execute(interaction: ChatInputCommandInteraction, db: Database) {
    const streaks = await db.getStats("get_streak");
    const totals = await db.getStats("total_gets");

    const streakMessage = mapStatToMessage("Top 5 getów z rzędu", streaks);
    const totalMessage = mapStatToMessage("Top 5 papież-getów", totals);

    if (!streakMessage && !totalMessage) {
      interaction.reply({
        content: "Brak getów! Może uda ci się to zmienić?",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    interaction.reply({
      content: `${mapStatToMessage("Top 5 getów z rzędu", streaks)}\n\n${mapStatToMessage("Top 5 papież-getów", totals)}`,
      flags: MessageFlags.Ephemeral
    });
  }
};

export default stats;
