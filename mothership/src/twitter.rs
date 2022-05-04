use rand::seq::SliceRandom;
use rand::Rng;
use serenity::model::channel::Message;
use serenity::prelude::*;

struct MsgCtx {
    run: bool,
    triggered_word: String,
}

const TRIGGERWORDS: [&'static str; 52] = [
    "don't care",
    "didn't ask",
    "l + ratio",
    "soyjak",
    "beta",
    "cringe",
    "cope",
    "seethe",
    "ok boomer",
    "incel",
    "virgin",
    "karen",
    "🤡 🤡 🤡",
    "🤡",
    "you are not just a clown, you are the entire circus",
    "💅 💅 💅",
    "nah this ain't it",
    "do better",
    "check your privilege",
    "pronouns in bio",
    "anime pfp",
    "🤢 🤢 🤮 🤮",
    "the cognitive dissonance is real with this one",
    "😂 🤣 🤣",
    "lol copium",
    "snowflake",
    "🚩 🚩 🚩",
    "those tears taste delicious",
    "lisa simpson meme template saying that your opinion is wrong",
    "😒 🙄 🧐 🤨",
    "wojak meme in which I'm the chad",
    "average your opinion fan vs average my opinion enjoyer",
    "random k-pop fancam",
    "cry more",
    "how's your wife's boyfriend doing",
    "cheetos breath",
    "intelligence 0",
    "r/whooooosh",
    "r/downvotedtooblivion",
    "blocked and reported",
    "yo Momma so fat",
    "go touch some grass",
    "cry about it",
    "get triggered",
    "comp sci",
    "eng sci",
    "eng",
    "premed",
    "mad?",
    "skill issue",
    "compsci",
    "trevor",
];

/**
 * Checks if the message fulfills the "twitter ratio" criteria (starts with one of the twiter words)
 * @param word the message content
 * @returns
 */
fn starts_with(word: &str) -> MsgCtx {
    for trigger_word in TRIGGERWORDS.iter() {
        if word.to_lowercase().starts_with(trigger_word) {
            return MsgCtx {
                run: true,
                triggered_word: trigger_word.to_string(),
            };
        }
    }

    return MsgCtx {
        run: false,
        triggered_word: String::from(""),
    };
}

/**
 * Conditionally runs the twitter ratio message if the message fulfills the criteria
 * @param message the Discord message object
 * @param
 */
pub async fn run_conditional(ctx: &Context, msg: &Message) -> () {
    let msg_ctx = starts_with(&msg.content);

    if msg_ctx.run {
        let mut return_words = vec![];
        for &trigger_word in TRIGGERWORDS.iter() {
            if rand::thread_rng().gen() && &msg_ctx.triggered_word != trigger_word {
                // random bool
                if trigger_word == "l + ratio" {
                    return_words.push("L+ratio")
                } else {
                    return_words.push(trigger_word)
                }
            }
        }

        return_words.shuffle(&mut rand::thread_rng());
        let msg_content: String = return_words.join(" + ");

        let msg = msg
            .channel_id
            .send_message(&ctx.http, |m| {
                m.content(msg_content)
                .embed(|e| e.image("https://media.discordapp.net/attachments/402306227809550359/945904082609127454/Drawing_Space.png"))
            })
            .await;

        if let Err(why) = msg {
            println!("Error sending message: {:?}", why);
        }
        ()
    }
}
