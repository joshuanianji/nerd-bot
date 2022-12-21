import { Command } from '../types/command';
import si from 'systeminformation';
import { EmbedBuilder } from '@discordjs/builders';
import { filesize } from 'filesize';

export const stat: Command = {
    name: 'stat',
    description: 'Basic stats about the running computer',
    run: async (_, intr) => {
        const embed = new EmbedBuilder()
            .setTitle('Hardware Stats');
        await addCpuStats(embed);
        await addMemStats(embed);
        intr.reply({ embeds: [embed] })
        return;
    }
}

const addCpuStats = async (embed: EmbedBuilder) => {
    const cpu = await si.cpu();
    const load = await si.currentLoad();
    embed.addFields({
        name: 'CPU Stats',
        value: `**Cores**: ${cpu.cores},\n**Avg Load**: ${load.currentLoad.toFixed(2)}%`
    })
}

const addMemStats = async (embed: EmbedBuilder) => {
    const mem = await si.mem();
    const usedMem = (mem.active / mem.total) * 100;
    embed.addFields({
        name: 'Memory Stats',
        value: `**Size**: ${filesize(mem.total)},\n**Used Active**: ${usedMem.toFixed(2)}%,\n**Swap Total**: ${filesize(mem.swaptotal)}`
    })
}
