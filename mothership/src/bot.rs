// currently, just using this to hold the Bot struct definition
// this prevents circular dependencies

use redis::aio::MultiplexedConnection;
use std::fmt;

#[derive(PartialEq, Eq)]
pub enum Mode {
    DEVELOPMENT,
    PRODUCTION,
}

impl fmt::Display for Mode {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        // Use `self.number` to refer to each positional data point.
        match self {
            Mode::DEVELOPMENT => write!(f, "DEVELOPMENT"),
            Mode::PRODUCTION => write!(f, "PRODUCTION"),
        }
    }
}

// store global data
pub struct Bot {
    // a multiplexed connection can be used with async/await
    // or, it can be used concurrently
    pub connection: MultiplexedConnection,
    pub mode: Mode,
}
