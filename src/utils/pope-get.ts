import "dotenv/config";

import {
  ChatInputCommandInteraction,
  Message,
  MessageFlags,
  OmitPartialGroupDMChannel
} from "discord.js";
import { TZDate } from "@date-fns/tz";
import { isSameDay } from "date-fns";

import { Database } from "../utils";

// CONSTANTS & GLOBAL VARIABLES
const { DISCORD_POPEGET_CHANNEL_ID = "" } = process.env;
const TARGET_HOURS = 21;
const TARGET_MINUTES = 37;

export const isMessagePopeGet = (message: OmitPartialGroupDMChannel<Message<boolean>>) => {
  if (message.channelId !== DISCORD_POPEGET_CHANNEL_ID) return false;
  return /^(pap(ie(ż|z)|aj)\s)*get$/gim.test(message.content);
};

export const popeGet = async (
  interaction: ChatInputCommandInteraction | OmitPartialGroupDMChannel<Message<boolean>>,
  db: Database
) => {
  const user = interaction instanceof Message ? interaction.author : interaction.user;
  const { createdTimestamp } = interaction;

  const currentGetTime = new TZDate(createdTimestamp, "Europe/Warsaw");
  const currentGetHours = currentGetTime.getHours();
  const currentGetMinutes = currentGetTime.getMinutes();

  // Not correct time
  if (currentGetHours !== TARGET_HOURS || currentGetMinutes !== TARGET_MINUTES) {
    if (!(interaction instanceof Message)) {
      interaction.reply({
        content: `Nie ta pora! Papież pozostaje nieuchwytny!`,
        flags: MessageFlags.Ephemeral
      });
    }
    return;
  }

  // First get
  const getData = await db.getPopeGet(user.id);
  if (!getData) {
    await db.recordFirstGet(user.id, user.globalName || user.username, createdTimestamp);
    interaction.reply({ content: "Gratuluję twojego pierwszego papież-geta! Oby tak dalej!" });
    return;
  }

  // Already got today
  const lastGetTime = new TZDate(getData.last_get_timestamp, "Europe/Warsaw");
  if (isSameDay(lastGetTime, currentGetTime)) {
    if (!(interaction instanceof Message)) {
      interaction.reply({
        content: "Doceniam zapał, ale papież został już chwycony dzisiaj! Spróbuj jutro!",
        flags: MessageFlags.Ephemeral
      });
    }
    return;
  }

  // Update get
  const newStreak = getData.get_streak + 1;
  const newCount = getData.total_gets + 1;
  await db.recordGet(user.id, createdTimestamp, newStreak);

  let messages = [
    `Gratulacje! Papież został chwycony! To już twój ${newCount} papież-get i ${newStreak} get z rzędu!`
  ];

  if (newStreak % 5 === 0) messages.unshift(`## ${newStreak} get z rzędu!`);
  if (newCount % 10 === 0) messages.unshift(`## ${newCount} papież-get!`);
  const content = messages.join("\n");

  if (interaction instanceof Message) {
    interaction.reply({ content });
  } else {
    interaction.reply({
      content,
      flags: messages.length > 1 ? MessageFlags.Ephemeral : undefined
    });
  }
};
