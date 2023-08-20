const { ButtonStyle, ButtonBuilder, ActionRowBuilder, EmbedBuilder } = require("discord.js");
const elo = require('./elo_system/elo')
const sqlActions = require('./elo_system/sqlActions')

module.exports = {
    dropDownHandler,
    buttonHandler
}

function dropDownHandler(interaction, reportState) {
    interaction.deferUpdate()
    
    switch (interaction.customId) {
        case 'player1': {
            reportState.players[0] = interaction.values[0];
        }
        break;
        case 'player2': {
            reportState.players[1] = interaction.values[0];
        }
        break;
        case 'player3': {
            reportState.players[2] = interaction.values[0];
        }
        break;
        case 'player4': {
            reportState.players[3] = interaction.values[0];
        }
        break;
    }
}

async function buttonHandler(interaction, reportState) {
    switch (interaction.customId) {
        case 'tie1': {

            let newStyle = ButtonStyle.Secondary
            if (reportState.ties[0] == false) {
                newStyle = ButtonStyle.Success
                reportState.ties[0] = true
            }
            else reportState.ties[0] = false

            interaction.message.components[4] = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('tie1')
                    .setLabel('1st & 2nd Tie')
                    .setStyle(newStyle),
                interaction.message.components[4].components[1],
                interaction.message.components[4].components[2],
                interaction.message.components[4].components[3],
            )
            interaction.update({components: interaction.message.components})
        }
        break;

        case 'tie2': {

            let newStyle = ButtonStyle.Secondary
            if (reportState.ties[1] == false) {
                newStyle = ButtonStyle.Success
                reportState.ties[1] = true
            }
            else reportState.ties[1] = false

            interaction.message.components[4] = new ActionRowBuilder().addComponents(
                interaction.message.components[4].components[0],
                new ButtonBuilder()
                    .setCustomId('tie2')
                    .setLabel('2nd & 3rd Tie')
                    .setStyle(newStyle),
                interaction.message.components[4].components[2],
                interaction.message.components[4].components[3],
            )
            interaction.update({components: interaction.message.components})
        }
        break;

        case 'tie3': {

            let newStyle = ButtonStyle.Secondary
            if (reportState.ties[2] == false) {
                newStyle = ButtonStyle.Success
                reportState.ties[2] = true
            }
            else reportState.ties[2] = false

            interaction.message.components[4] = new ActionRowBuilder().addComponents(
                interaction.message.components[4].components[0],
                interaction.message.components[4].components[1],
                new ButtonBuilder()
                    .setCustomId('tie3')
                    .setLabel('3rd & 4th Tie')
                    .setStyle(newStyle),
                interaction.message.components[4].components[3],
            )
            interaction.update({components: interaction.message.components})
        }
        break;

        case 'submit': {
            if (reportState.players[0] == null || reportState.players[1] == null) {
                interaction.reply({content: 'ERROR: Invalid Form', ephemeral: true})
                return
            }
            else if (reportState.players[3] != null && reportState.players[2] == null) {
                interaction.reply({content: 'ERROR: Invalid Form', ephemeral: true})
                return
            }
            else if ((new Set(reportState.players)).size !== Array.length) {
                interaction.reply({content: 'ERROR: Invalid Form', ephemeral: true})
            }

            

            let submittedEmbed = new EmbedBuilder()
                .setColor(0x000000)
                .setTitle('Submitted')

            let channel = await interaction.client.channels.fetch(interaction.channelId)
            let newMessage = await channel.send(await renderForm(reportState, interaction))

            reportState.messageID = newMessage.id

            interaction.update({embeds: [submittedEmbed], components: []})

        }
        break;

        case 'confirm':
            if (!reportState.players.includes(interaction.user.id)) {
                interaction.deferUpdate()
                return
            }

            for (let i = 0; i < 4; i++) {
                if (interaction.user.id === reportState.players[i]) {
                    reportState.confirmed[i] = true;
                    interaction.update(await renderForm(reportState, interaction))
                    break;
                }
            }

            let readyToUpdate = true
            for (let i = 0; i < 4; i++) {
                if (reportState.players[i] != null && reportState.confirmed[i] == false) {
                    readyToUpdate = false
                    break
                }
            }

            if (readyToUpdate == false) return


            let members = []
            for (player of reportState.players) {
                if (player != null)
                members.push(await interaction.guild.members.fetch(player))
            }
            let newRatings = await elo.getNewRatings(members)

            sqlActions.setRatings(members, newRatings)
            
        break;

        case 'reject':

            if (!reportState.players.includes(interaction.user.id)) {
                interaction.deferUpdate()
                return
            }

            interaction.message.delete()
        break;
    
        default:
            break;
    }
}


async function renderForm(reportState, interaction) {
    let place1 = '1st'
    let place2 = (reportState.ties[0]) ? '1st' : '2nd'
    let place3 = '3rd'
    if (reportState.ties[1]) place3 = place2
    let place4 = '4th'
    if (reportState.ties[2]) place4 = place3


    let readyToUpdate = true
    for (let i = 0; i < 4; i++) {
        if (reportState.players[i] != null && reportState.confirmed[i] == false) {
            readyToUpdate = false
            break
        }
    }

    let title = (readyToUpdate) ? 'Game Reported!' : 'Dominion Game Confirmation'

    let members = []
    for (player of reportState.players) {
        if (player != null)
        members.push(await interaction.guild.members.fetch(player))
    }
    let newRatings = await elo.getNewRatings(members, reportState.ties)
    let oldRatings = await sqlActions.getRatings(members)

    let ratingsDelta = []
    for (let i = 0; i < newRatings.length; i++) {
        ratingsDelta.push(newRatings[i] - oldRatings[i])
    }

    //console.log(oldRatings)
    //console.log(newRatings)

    let embed = new EmbedBuilder()
    .setColor(0x41fa72)
    .setTitle(title)
    .addFields(
        {name: place1 ,value: `<@${reportState.players[0]}> ${(reportState.confirmed[0]) ? '✅' : '⏳'}\n(${(ratingsDelta[0] > 0) ? `+${ratingsDelta[0]}` : ratingsDelta[0]}) ${oldRatings[0]} -> ${newRatings[0]}`},
        {name: place2 ,value: `<@${reportState.players[1]}> ${(reportState.confirmed[1]) ? '✅' : '⏳'}\n(${(ratingsDelta[1] > 0) ? `+${ratingsDelta[1]}` : ratingsDelta[1]}) ${oldRatings[1]} -> ${newRatings[1]}`},
    )
    .setTimestamp()

    if (reportState.players[2] != null) {
        embed.addFields({name: place3, value: `<@${reportState.players[2]}> ${(reportState.confirmed[2]) ? '✅' : '⏳'}\n(${(ratingsDelta[2] > 0) ? `+${ratingsDelta[2]}` : ratingsDelta[2]}) ${oldRatings[2]} -> ${newRatings[2]}`})
    }
    if (reportState.players[3] != null) {
        embed.addFields({name: place4, value: `<@${reportState.players[3]}> ${(reportState.confirmed[3]) ? '✅' : '⏳'}\n(${(ratingsDelta[3] > 0) ? `+${ratingsDelta[3]}` : ratingsDelta[3]}) ${oldRatings[3]} -> ${newRatings[3]}`})
    }

    let buttonRow = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('confirm')
            .setLabel('Confirm')
            .setStyle(ButtonStyle.Success)
            .setDisabled(false),
        new ButtonBuilder()
            .setCustomId('reject')
            .setLabel('Reject')
            .setStyle(ButtonStyle.Danger)
    );

    let messageComponents = (readyToUpdate) ? [] : [buttonRow]

    return {embeds: [embed], components: messageComponents}
}