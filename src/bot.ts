import { config } from 'dotenv';
config()
import { Client, Events, GatewayIntentBits } from 'discord.js'
import { createAudioPlayer, NoSubscriberBehavior, createAudioResource, joinVoiceChannel, getVoiceConnection } from '@discordjs/voice';
import YTDlpWrap from 'yt-dlp-wrap';
import { mkdirSync } from 'fs';
import { v4 as uuid } from 'uuid';

const token = process.env.TOKEN;
const channelId = process.env.CHANNEL_ID
const guildId = process.env.GUILD_ID

if (channelId == undefined || guildId == undefined) {
	console.error("Undefined CID or GID")
	process.exit(1)
}

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildPresences,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMessageTyping,
		GatewayIntentBits.GuildIntegrations,
		GatewayIntentBits.GuildWebhooks,
		GatewayIntentBits.GuildInvites,
		GatewayIntentBits.GuildScheduledEvents,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.DirectMessageReactions,
		GatewayIntentBits.DirectMessageTyping,
		GatewayIntentBits.MessageContent,
	]
});

const audioPlayer = createAudioPlayer({
	behaviors: {
		noSubscriber: NoSubscriberBehavior.Play,
	}
});

const ytDlp = new YTDlpWrap('/usr/bin/yt-dlp')

client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);

	client.channels.fetch(channelId, {
		allowUnknownGuild: false
	}).then(channel => {
		if (channel == null) return;
		if (channel.isDMBased()) return;
		const voiceConnection = joinVoiceChannel({
			channelId: channel.id,
			guildId: channel.guild.id,
			selfDeaf: false,
			adapterCreator: channel.guild.voiceAdapterCreator
		});
		voiceConnection.subscribe(audioPlayer)
	})
	mkdirSync("/tmp/xemusic", {
		recursive: true
	})
});

client.on(Events.MessageCreate, message => {
	if (!message.content.startsWith("!play")) return;
	if (message.content.split(" ").length !== 2) return;
	const voiceConnection = getVoiceConnection(guildId)
	if (!voiceConnection) {
		console.error("Could not find connection")
		process.exit(1)
	}
	console.log("Received play command")
	const audioUrl = message.content.split(" ")[1]
	const outFile = "/tmp/xemusic/" + uuid()
	const readableAudioStream = ytDlp.exec([
		"-x",
		//"--audio-format",
		//"mp3",
		audioUrl,
		"-o",
		outFile
	]).on('close', () => {
		console.log(outFile)
		const audioResource = createAudioResource(outFile + ".opus")
		audioPlayer.play(audioResource)
	}).on('error', err => console.error(err))
});

client.login(token);
