use std::env;

use dotenv;
use serenity::async_trait;
use serenity::model::channel::Message;
use serenity::model::gateway::Ready;
use serenity::prelude::*;
mod dadjoke;
mod twitter;
use redis;

struct Handler;

#[async_trait]
impl EventHandler for Handler {
    // Set a handler for the `message` event - so that whenever a new message
    // is received - the closure (or function) passed will be called.
    //
    // Event handlers are dispatched through a threadpool, and so multiple
    // events can be dispatched simultaneously.
    async fn message(&self, ctx: Context, msg: Message) {
        let token = env::var("MODE").expect("Expected token 'MODE' in the environment");

        let dev_check: bool = token == "development" && msg.author.id.0 == 240645351705542658;
        let prod_check: bool = token == "production" && msg.author.id.0 == 239876252331278347;

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
    async fn ready(&self, _: Context, ready: Ready) {
        let mode = env::var("MODE").expect("Expected MODE in environment");
        println!("{} is connected, mode={}", ready.user.name, mode);
    }
}

#[tokio::main]
async fn main() {
    let env_path: String = env::var("ENV_PATH").expect("Expected 'ENV_PATH' variable");
    println!("Reading env file from path '{}'", env_path);
    dotenv::from_path(env_path).expect("Expected .env file!");
    // Configure the client with your Discord bot token in the environment.
    let token = env::var("DISCORD_TOKEN").expect("Expected a token in the environment");
    // Set gateway intents, which decides what events the bot will be notified about
    let intents = GatewayIntents::GUILD_MESSAGES
        | GatewayIntents::DIRECT_MESSAGES
        | GatewayIntents::MESSAGE_CONTENT;

    // REDIS
    // connect to the redis db, and check if the `demon-mode` key is set to TRUE
    let redis_url = get_redis_url().expect("Failed to get the Redus URL!");
    let client = redis::Client::open(redis_url).expect("Invalid connection URL");
    let mut con = client
        .get_connection()
        .expect("Couldn't get async connection!");

    // defaults it to true if not set
    let _ = init_demon_mode(&mut con);

    // Create a new instance of the Client, logging in as a bot. This will
    // automatically prepend your bot token with "Bot ", which is a requirement
    // by Discord for bot users.
    let mut client = Client::builder(&token, intents)
        .event_handler(Handler)
        .await
        .expect("Err creating client");

    // Finally, start a single shard, and start listening to events.
    //
    // Shards will automatically attempt to reconnect, and will perform
    // exponential backoff until it reconnects.
    if let Err(why) = client.start().await {
        println!("Client error: {:?}", why);
    }
}

fn get_redis_url() -> Result<String, env::VarError> {
    let redis_host: String = env::var("REDIS_HOST")?;
    let redis_port: String = env::var("REDIS_PORT")?;
    let redis_pass: String = env::var("REDIS_PASSWORD")?;
    let redis_url = format!("redis://:{}@{}:{}", redis_pass, redis_host, redis_port);
    println!("Redis url: '{}'", redis_url);
    Ok(redis_url)
}

fn init_demon_mode(con: &mut redis::Connection) -> redis::RedisResult<()> {
    let res: u8 = redis::cmd("SETNX").arg("demon-mode").arg(true).query(con)?;
    if res == 1 {
        println!("Set demon-mode to true");
    } else {
        let demon_mode: bool = redis::cmd("GET").arg("demon-mode").query(con)?;
        println!("Demon-mode already set to '{}'!", demon_mode);
    }
    Ok(())
}
