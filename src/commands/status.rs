// the status slash command gives dev info about the bot

// crate:: references root of the filesystem
//
use crate::bot::Bot;

use serenity::model::interactions::application_command::ApplicationCommandInteraction;
use serenity::model::interactions::InteractionResponseType;
use serenity::prelude::*;

// initializes a command
pub fn create_cmd(
    cmd: &mut serenity::builder::CreateApplicationCommand,
) -> &mut serenity::builder::CreateApplicationCommand {
    cmd.name("status")
        .description("Checks the status of the bot")
}

pub async fn run(
    bot: &Bot,
    ctx: &Context,
    command: &ApplicationCommandInteraction,
) -> Result<(), serenity::Error> {
    let demon_mode: bool = redis::cmd("GET")
        .arg("demon-mode")
        // to satisfy the compiler, we clone the connection
        // but this makes sense, so the connection is owned by us, and can be mutable
        // cloning shouldn't be very expensive, since this just clones the connection
        // https://docs.rs/redis/latest/redis/aio/struct.MultiplexedConnection.html
        .query_async(&mut bot.connection.clone())
        .await
        .expect("Failed to get demon-mode from redis");

    command
        .create_interaction_response(&ctx.http, |response| {
            response
                .kind(InteractionResponseType::ChannelMessageWithSource)
                .interaction_response_data(|m| {
                    m.embed(|embed| {
                        embed
                            .title("Bot Status")
                            .field("Mode", format!("Mode: **{}**", bot.mode), false)
                            .field(
                                "Demon mode:",
                                format!("{}", if demon_mode { "ON" } else { "OFF" }),
                                false,
                            )
                    })
                })
        })
        .await
}
