import { Command } from '../types/command';
import si from 'systeminformation';
import { EmbedBuilder } from '@discordjs/builders';
import { filesize } from 'filesize';

export const stat: Command = {
    name: 'stat',
    description: 'Basic stats about the running computer',
    dm_permission: false,
    run: async (client, intr) => {
        const embed = new EmbedBuilder()
            .setTitle('Stats');
        await addCpuStats(embed);
        await addMemStats(embed);

        embed.addFields({
            name: 'Reaction Collectors',
            value: `**Count**: ${client.reactionCollectors}`
        })

        intr.reply({ embeds: [embed] })
        return;
    }
}

const addCpuStats = async (embed: EmbedBuilder) => {
    const cpu = await si.cpu();
    const load = await si.currentLoad();
    embed.addFields({
        name: 'CPU',
        value: `**Cores**: ${cpu.cores},\n**Avg Load**: ${load.currentLoad.toFixed(2)}%`
    })
}

const addMemStats = async (embed: EmbedBuilder) => {
    const mem = await si.mem();
    const usedMem = (mem.active / mem.total) * 100;
    embed.addFields({
        name: 'Memory',
        value: `**Size**: ${filesize(mem.total)},\n**Used Active**: ${usedMem.toFixed(2)}%,\n**Swap Total**: ${filesize(mem.swaptotal)}`
    })
}
