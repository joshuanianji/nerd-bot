import { AudioPlayerStatus, createAudioPlayer, createAudioResource, DiscordGatewayAdapterCreator, joinVoiceChannel } from '@discordjs/voice';
import { CommandInteraction } from 'discord.js';
import { Context } from '../../interfaces/context';

export const join = async (ctx: Context, intr: CommandInteraction<'cached'>): Promise<void> => {
    // the interaction needs to be cached AND in a build for `.member` to be a GuildMember
    // GuildMember has the vc info we want.
    const vcChannel = intr.member.voice.channel;
    if (!vcChannel) {
        return intr.reply('You need to be in a voice channel!');
    }

    const connection = joinVoiceChannel({
        channelId: vcChannel.id,
        guildId: intr.guildId,
        // type casting because we have a string|null and string|undefined error?
        adapterCreator: intr.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator
    });

    await intr.reply(`Joined ${vcChannel.toString()}!`);

    // play audio
    const vineboom = createAudioResource(ctx.media['vine-boom']);
    console.log(`resource created: ${vineboom.playbackDuration}`)
    const player = createAudioPlayer();
    connection.subscribe(player);
    player.play(vineboom);

    player.once(AudioPlayerStatus.Idle, () => {
        intr.editReply('Played vine boom!');
        player.stop();
    });
}