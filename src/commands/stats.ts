import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import { PopeGet } from "../types";

import { Database } from "../utils";

const mapStatToMessage = (
  title: string,
  stats: PopeGet[],
  statField: "total_gets" | "get_streak"
) => {
  if (stats.length === 0) return "";
  return [
    `## ${title}:`,
    ...stats.map((stat, index) => `**${index + 1}.** ${stat.user_name} - ${stat[statField]} getów`)
  ].join("\n");
};

const stats = {
  data: new SlashCommandBuilder()
    .setName("wyniki")
    .setDescription("Wypisuje aktualne wyniki papież-getów."),
  async execute(interaction: ChatInputCommandInteraction, db: Database) {
    const streaks = await db.getStats("get_streak");
    const totals = await db.getStats("total_gets");
    if (!streaks || !totals) {
      interaction.reply({
        content: "Przykro mi, w moich papieskich obwodach wystąpił błąd. Spróbuj jeszcze raz.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const totalMessage = mapStatToMessage("Top 5 papież-getów", totals, "total_gets");
    const streakMessage = mapStatToMessage("Top 5 getów z rzędu", streaks, "get_streak");

    if (!streakMessage && !totalMessage) {
      interaction.reply({
        content: "Brak getów! Może uda ci się to zmienić?",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    interaction.reply({
      content: [totalMessage, streakMessage].filter(Boolean).join("\n\n"),
      flags: MessageFlags.Ephemeral
    });
  }
};

export default stats;
