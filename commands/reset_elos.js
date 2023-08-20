const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const sqlActions = require('../elo_system/sqlActions')


module.exports = {
	data: new SlashCommandBuilder()
        .setName('reset_elos')
        .setDescription('Resets the Elo of all server members.'),
	async execute(interaction) {
        console.log(interaction.member.permissions.has(PermissionsBitField.Flags.Administrator, true))
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator, true)) {
            interaction.reply({content: 'You do not have permission to use this command.', ephemeral: true})
            return
        }

        await sqlActions.resetRatings(interaction.guild.id)

        interaction.reply({content: 'All ratings have been reset.'});
        
	},
};