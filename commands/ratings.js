const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const sqlActions = require('../elo_system/sqlActions')


module.exports = {
	data: new SlashCommandBuilder()
        .setName('ratings')
        .setDescription('View elo leaderboard'),
	async execute(interaction) {
        let ratings = await sqlActions.getServerRatings(interaction.guild.id)
        
        let message = (ratings.length > 0) ? `` : 'No ratings to display.'
        for (let i = 0; i < ratings.length; i++) {
            message += `${i + 1}. <@${ratings[i].user_id}> (${ratings[i].rating})\n`
        }

        let embed = new EmbedBuilder()
            .setColor(0x41fa72)
            .setTitle('Dominion Rankings')
            .addFields(
                {name: '​', value: message}
            )
            .setTimestamp()

        interaction.reply({embeds: [embed]})
	},
};