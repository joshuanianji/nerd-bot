use std::env;

use dotenv;
use redis;

use serenity::async_trait;
use serenity::model::channel::Message;
use serenity::model::gateway::Ready;
use serenity::model::id::GuildId;
use serenity::model::interactions::application_command::ApplicationCommand;
use serenity::model::interactions::{Interaction, InteractionResponseType};
use serenity::prelude::*;

// events
mod dadjoke;
mod twitter;

// commands
mod commands;

// other stuff
mod bot;
use bot::Bot;
use bot::Mode;

#[async_trait]
impl EventHandler for Bot {
    // Responding to slash commands!
    async fn interaction_create(&self, ctx: Context, interaction: Interaction) {
        if let Interaction::ApplicationCommand(command) = interaction {
            // Run command
            let run_result = match command.data.name.as_str() {
                "status" => commands::status::run(self, &ctx, &command).await,
                "demon" => commands::demon::run(self, &ctx, &command).await,
                // else,
                _ => {
                    command
                        .create_interaction_response(&ctx.http, |response| {
                            response
                                .kind(InteractionResponseType::ChannelMessageWithSource)
                                .interaction_response_data(|message| {
                                    message.content("Command not implemented!")
                                })
                        })
                        .await
                }
            };

            if let Err(why) = run_result {
                println!("Cannot respond to slash command: {}", why);
            }
        }
    }

    // Set a handler for the `message` event - so that whenever a new message
    // is received - the closure (or function) passed will be called.
    //
    // Event handlers are dispatched through a threadpool, and so multiple
    // events can be dispatched simultaneously.
    async fn message(&self, ctx: Context, msg: Message) {
        let dev_check: bool =
            self.mode == Mode::DEVELOPMENT && msg.author.id.0 == 240645351705542658;
        let prod_check: bool =
            self.mode == Mode::PRODUCTION && msg.author.id.0 == 239876252331278347;

        if dev_check || prod_check {
            dadjoke::run_conditional(&ctx, &msg).await;
            twitter::run_conditional(&ctx, &msg).await;
        }
    }

    // Set a handler to be called on the `ready` event. This is called when a
    // shard is booted, and a READY payload is sent by Discord. This payload
    // contains data like the current user's guild Ids, current user data,
    // private channels, and more.
    //
    // In this case, just print what the current user's username is.
    async fn ready(&self, ctx: Context, ready: Ready) {
        let mode = env::var("MODE").expect("Expected MODE in environment");
        println!("{} is connected, mode={}", ready.user.name, mode);
        let guild_id = GuildId(
            env::var("GUILD_ID")
                .expect("Expected GUILD_ID in environment")
                .parse()
                .expect("GUILD_ID must be an integer"),
        );

        match self.mode {
            // in dev mode, set application commands guild-wide
            // this is instantaneous
            Mode::DEVELOPMENT => {
                let commands =
                    GuildId::set_application_commands(&guild_id, &ctx.http, |commands| {
                        commands
                            .create_application_command(commands::status::create_cmd)
                            .create_application_command(commands::demon::create_cmd)
                    })
                    .await;
                match commands {
                    Ok(cmds) => {
                        println!(
                            "Successfully added local guild slash commands for guild {}: {:#?}",
                            guild_id,
                            cmds.iter().map(|x| x.name.as_str()).collect::<Vec<&str>>()
                        );
                    }
                    Err(why) => {
                        println!(
                            "Error adding local guild slash commands for guild {}: {}",
                            guild_id, why
                        );
                    }
                }
            }
            // in production mode, set app commands globally
            // this propagates through Discord's servers, taking around an hour.
            Mode::PRODUCTION => {
                let global_commands =
                    ApplicationCommand::set_global_application_commands(&ctx.http, |commands| {
                        commands
                            .create_application_command(commands::status::create_cmd)
                            .create_application_command(commands::demon::create_cmd)
                    })
                    .await;
                match global_commands {
                    Ok(cmds) => {
                        println!(
                            "Successfully added global slash commands: {:#?}",
                            cmds.iter().map(|x| x.name.as_str()).collect::<Vec<&str>>()
                        );
                    }
                    Err(why) => {
                        println!("Error adding global slash commands: {}", why);
                    }
                }
            }
        }
    }
}

#[tokio::main]
async fn main() {
    // getting environment variables and stuff

    let env_path: String = env::var("ENV_PATH").expect("Expected 'ENV_PATH' variable");
    println!("Reading env file from path '{}'", env_path);
    dotenv::from_path(env_path).expect("Expected .env file!");
    // Configure the client with your Discord bot token in the environment.
    let token = env::var("DISCORD_TOKEN").expect("Expected a token in the environment");
    let bot_mode: Mode = get_mode().expect("Unable to get current mode:");

    // Set gateway intents, which decides what events the bot will be notified about
    let intents = GatewayIntents::GUILD_MESSAGES
        | GatewayIntents::DIRECT_MESSAGES
        | GatewayIntents::MESSAGE_CONTENT;

    // REDIS
    // connect to the redis db, and check if the `demon-mode` key is set to TRUE
    // getting a multiplex async connection so it can work with discord's async style (i think?)
    let redis_url = get_redis_url().expect("Failed to get the Redus URL!");
    let client = redis::Client::open(redis_url).expect("Invalid connection URL");
    let mut con = client
        .get_multiplexed_async_connection()
        .await
        .expect("Couldn't get async connection!");

    // defaults it to true if not set
    let _ = init_demon_mode(&mut con)
        .await
        .expect("Failed to init demon mode");

    // Create a new instance of the Client, logging in as a bot. This will
    // automatically prepend your bot token with "Bot ", which is a requirement
    // by Discord for bot users.
    let bot = Bot {
        connection: con,
        mode: bot_mode,
    };
    let mut client = Client::builder(&token, intents)
        .event_handler(bot)
        .await
        .expect("Err creating client");

    // https://github.com/serenity-rs/songbird/blob/87918058042c6ae8712f29f3558e27de11d15531/examples/serenity/voice/src/main.rs
    tokio::spawn(async move {
        let _ = client
            .start()
            .await
            .map_err(|why| println!("Client ended: {:?}", why));
    });
    tokio::signal::ctrl_c()
        .await
        .expect("Error waiting for CTRL-C");
    println!("Received Ctrl-C, shutting down.");
}

fn get_redis_url() -> Result<String, env::VarError> {
    let redis_host: String = env::var("REDIS_HOST")?;
    let redis_port: String = env::var("REDIS_PORT")?;
    let redis_pass: String = env::var("REDIS_PASSWORD")?;
    let redis_url = format!("redis://:{}@{}:{}", redis_pass, redis_host, redis_port);
    Ok(redis_url)
}

async fn init_demon_mode(con: &mut redis::aio::MultiplexedConnection) -> redis::RedisResult<()> {
    let res: u8 = redis::cmd("SETNX")
        .arg("demon-mode")
        .arg(true)
        .query_async(con)
        .await?;
    if res == 1 {
        println!("Set demon-mode to true");
    } else {
        let demon_mode: bool = redis::cmd("GET").arg("demon-mode").query_async(con).await?;
        println!("Demon-mode already set to '{}'!", demon_mode);
    }
    Ok(())
}

fn get_mode() -> Result<Mode, String> {
    let token = env::var("MODE").expect("Expected token 'MODE' in the environment");
    match token.as_str() {
        "development" => Ok(Mode::DEVELOPMENT),
        "production" => Ok(Mode::PRODUCTION),
        _ => Err(String::from("Unknown mode!")),
    }
}
