const { SlashCommandBuilder, ActionRowBuilder, UserSelectMenuBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
        .setName('report')
        .setDescription('Creates a record of a Dominion Game.'),
	async execute(interaction) {

        const row1 = new ActionRowBuilder()
            .addComponents(
                new UserSelectMenuBuilder()
                    .setCustomId('player1')
                    .setPlaceholder('Select 1st place player')
                    .setDisabled(false),
            );

        const buttonRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('tie')
                    .setLabel('1st & 2nd Tie')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('submit')
                    .setLabel('Submit')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(false),
                new ButtonBuilder('')
                    .setCustomId('previous')
                    .setLabel('◀️')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('▶️')
                    .setStyle(ButtonStyle.Secondary)
            );

		await interaction.reply({ components: [row1, buttonRow], ephemeral: true, fetchResponse: true})
        const message = await interaction.fetchReply()
        return {
            players: [],
            messageID: message.id,
            playerOnScreen: 0
        }
	},
};