// toggles demon-mode

use crate::bot::Bot;

use redis::RedisResult;
use serenity::model::interactions::application_command::{
    ApplicationCommandInteraction, ApplicationCommandInteractionDataOptionValue,
    ApplicationCommandOptionType,
};
use serenity::model::interactions::InteractionResponseType;
use serenity::prelude::*;

// initializes a command
pub fn create_cmd(
    cmd: &mut serenity::builder::CreateApplicationCommand,
) -> &mut serenity::builder::CreateApplicationCommand {
    cmd.name("demon")
        .description("Turns on/off demon mode")
        .create_option(|option| {
            option
                .name("on")
                .description("True to turn on")
                .kind(ApplicationCommandOptionType::Boolean)
                .required(true)
        })
}

pub async fn run(
    bot: &Bot,
    ctx: &Context,
    command: &ApplicationCommandInteraction,
) -> Result<(), serenity::Error> {
    let curr_demon_mode: bool = redis::cmd("GET")
        .arg("demon-mode")
        // to satisfy the compiler, we clone the connection
        // but this makes sense, so the connection is owned by us, and can be mutable
        // cloning shouldn't be very expensive, since this just clones the connection
        // https://docs.rs/redis/latest/redis/aio/struct.MultiplexedConnection.html
        .query_async(&mut bot.connection.clone())
        .await
        .expect("Failed to get demon-mode from redis");

    let options = command
        .data
        .options
        .get(0)
        .expect("Expected attachment option")
        .resolved
        .as_ref()
        .expect("Expected attachment object");

    // hmm, code looks really bad here
    let response_msg: String =
        if let ApplicationCommandInteractionDataOptionValue::Boolean(switch) = options {
            // check if the switch changes anything or not
            if *switch != curr_demon_mode {
                let a: RedisResult<()> = redis::cmd("SET")
                    .arg("demon-mode")
                    .arg(switch)
                    .query_async(&mut bot.connection.clone())
                    .await;
                if let Err(why) = a {
                    format!("Failed to set demon-mode to {}: {}", switch, why)
                } else {
                    format!("Demon mode is now {}!", if *switch { "on" } else { "off" })
                }
            } else {
                // tell the user mode stayed the same
                format!(
                    "Demon mode is already {}!",
                    if *switch { "on" } else { "off" }
                )
            }
        } else {
            "Invalid option".to_string()
        };

    command
        .create_interaction_response(&ctx.http, |response| {
            response
                .kind(InteractionResponseType::ChannelMessageWithSource)
                .interaction_response_data(|m| m.content(response_msg))
        })
        .await
}
