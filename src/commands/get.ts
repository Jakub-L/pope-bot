import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from 'discord.js';

import { TZDate } from '@date-fns/tz';

const TARGET_HOURS = 21;
const TARGET_MINUTES = 37;

const get = {
  data: new SlashCommandBuilder().setName('get').setDescription('Chwyta papieża!'),
  async execute(interaction: ChatInputCommandInteraction) {
    const { createdTimestamp } = interaction;

    const polishTime = new TZDate(createdTimestamp, 'Europe/Warsaw');
    const polishHours = polishTime.getHours();
    const polishMinutes = polishTime.getMinutes();

    if (polishHours !== TARGET_HOURS || polishMinutes !== TARGET_MINUTES) {
      interaction.reply({content: `Nie ta pora! Papież pozostaje nieuchwytny!`, flags: MessageFlags.Ephemeral})
      return;
    }

    interaction.reply({ content: 'Papież został chwycony!', flags: MessageFlags.Ephemeral });
  }
};

export default get;
