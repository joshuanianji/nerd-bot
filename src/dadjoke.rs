use serenity::model::channel::Message;
use serenity::prelude::*;

pub struct MsgCtx {
    pub run: bool,
    pub remaining: String,
}

const TRIGGERWORDS: [&'static str; 3] = ["i'm ", "im ", "i am "];

/**
 * Checks if the message starts with one of the trigger words
 * @param word the message content
 * @returns DadJokeReturn object
 */
pub fn test(word: &str) -> MsgCtx {
    for trigger_word in TRIGGERWORDS.iter() {
        if let Some(remaining) = word.strip_prefix(trigger_word) {
            let mut rem = remaining.to_string();
            rem.truncate(1900);
            return MsgCtx {
                run: true,
                remaining: rem,
            };
        }
    }

    return MsgCtx {
        run: false,
        remaining: word.to_string(),
    };
}

pub async fn run_conditional(ctx: &Context, msg: &Message) -> () {
    let msg_ctx = test(&msg.content);

    if msg_ctx.run {
        let msg = msg
            .channel_id
            .send_message(&ctx.http, |m| {
                m.content(format!(
                    "You're not {}, you're {}!",
                    msg_ctx.remaining,
                    msg.author.to_string()
                ))
                .embed(|e| e.image("https://c.tenor.com/9RBYPqpnSeUAAAAC/crying-emoji.gif"))
            })
            .await;

        if let Err(why) = msg {
            println!("Error sending message: {:?}", why);
        }
    }
}
