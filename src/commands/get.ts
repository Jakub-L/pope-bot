import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import { TZDate } from "@date-fns/tz";
import { isSameDay } from "date-fns";

import { Database } from "../utils";

const TARGET_HOURS = 21;
const TARGET_MINUTES = 37;

const get = {
  data: new SlashCommandBuilder().setName("get").setDescription("Chwyta papieża!"),
  async execute(interaction: ChatInputCommandInteraction, db: Database) {
    const { createdTimestamp, user } = interaction;

    const currentGetTime = new TZDate(createdTimestamp, "Europe/Warsaw");
    const currentGetHours = currentGetTime.getHours();
    const currentGetMinutes = currentGetTime.getMinutes();

    // Not correct time
    if (currentGetHours !== TARGET_HOURS || currentGetMinutes !== TARGET_MINUTES) {
      interaction.reply({
        content: `Nie ta pora! Papież pozostaje nieuchwytny!`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    // First get
    const getData = await db.getPopeGet(interaction.user.id);
    if (!getData) {
      await db.recordFirstGet(
        interaction.user.id,
        user.globalName || user.username,
        createdTimestamp
      );
      interaction.reply({ content: "Gratuluję twojego pierwszego papież-geta! Oby tak dalej!" });
      return;
    }

    // Already got today
    const lastGetTime = new TZDate(getData.last_get_timestamp, "Europe/Warsaw");
    if (isSameDay(lastGetTime, currentGetTime)) {
      interaction.reply({
        content: "Doceniam zapał, ale papież został już chwycony dzisiaj! Spróbuj jutro!",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    // Update get
    const newStreak = getData.get_streak + 1;
    const newCount = getData.total_gets + 1;
    await db.recordGet(interaction.user.id, createdTimestamp, newStreak);

    let messages = [
      `Gratulacje! Papież został chwycony! To już twój ${newCount} papież-get i ${newStreak} get z rzędu!`
    ];

    if (newStreak % 5 === 0) messages.unshift(`## ${newStreak} get z rzędu!`);
    if (newCount % 10 === 0) messages.unshift(`## ${newCount} papież-get!`);

    interaction.reply({
      content: messages.join("\n"),
      flags: messages.length > 1 ? MessageFlags.Ephemeral : undefined
    });
  }
};

export default get;
