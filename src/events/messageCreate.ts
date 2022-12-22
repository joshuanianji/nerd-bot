import { Message } from 'discord.js';
import Client from '../client';
import log from './../util/log';

export const messageCreate = (client: Client, message: Message) => {
    // set up the collector to only react to nerd emojis
    // also, set collector to run for 15 minutes (900,000 milliseconds)
    const collector = message.createReactionCollector({
        filter: (reaction, user) => reaction.emoji.name === '🤓' && !user.bot,
        time: 900_000
    });

    client.incrementReactionCollector();

    collector.on('collect', (reaction) => {
        // in case you want to do something when someone reacts with 🤓
        log.info(`Collected a new ${reaction.emoji.name} reaction`);
    });

    // fires when the time limit or the max is reached
    collector.on('end', (collected, reason) => {
        // reactions are no longer collected
        log.info(`Collected ${collected.size} emojis. Ended because ${reason}`);
        client.decrementReactionCollector();
    });
}