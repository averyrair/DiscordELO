const Discord = require('discord.js');
const { db } = require('./db');
const fs = require('node:fs');
const path = require('node:path');
const sqlActions = require('./elo_system/sqlActions')
const interactionHandler = require('./interactionHandler');
const { ButtonStyle, ComponentType } = require('discord.js');
require('dotenv').config();

const client = new Discord.Client({
    intents: [Discord.GatewayIntentBits.GuildMembers, Discord.GatewayIntentBits.GuildPresences, ]
})

//slash command setup
client.commands = new Discord.Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
}

db.connect((err) => {
    if (err) throw err;
    console.log('MySQL connected...');
})

client.once('ready', () => {
    console.log('DominionBot is online...');

    client.guilds.cache.forEach(g => {      
        g.roles.fetch();
    });
})


var gameReports = []

client.on('interactionCreate', async interaction => {

    if (!interaction.isChatInputCommand()) {
        let reportState = gameReports.filter(report => report.messageID == interaction.message.id)[0]

        if (reportState == null) {
            interaction.reply({content: 'something went wrong', ephemeral: true})
            return
        }

        if (interaction.isUserSelectMenu()) {
            interactionHandler.dropDownHandler(interaction, reportState)
            return
        }
        else if (interaction.isButton()) {
            interactionHandler.buttonHandler(interaction, reportState)
            return
        }
    } else {
        const command = client.commands.get(interaction.commandName);

        if (!command) return;
    
        try {
            gameReports.push(await command.execute(interaction));
        } catch (error) {
            console.error(error);
            await interaction.reply({content: 'There was an error while executing this command.', ephemeral: true})
        }
    }
})

client.login(process.env.BOT_TOKEN);