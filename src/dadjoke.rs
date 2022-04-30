pub struct Ret {
    pub run: bool,
    pub remaining: String,
}

/**
 * Checks if the message starts with one of the trigger words
 * @param word the message content
 * @returns DadJokeReturn object
 */
pub fn test(word: String) -> Ret {
    let trigger_words = vec!["i'm ", "im ", "i am "];

    for trigger_word in trigger_words.iter() {
        if let Some(remaining) = word.strip_prefix(trigger_word) {
            let mut rem = remaining.to_string();
            rem.truncate(1900);
            return Ret {
                run: true,
                remaining: rem,
            };
        }
    }

    return Ret {
        run: false,
        remaining: word.to_string(),
    };
}
