FROM rust:1.60 as build


# rust-musl-builder sets workdir to home/rust/src
RUN USER=root cargo new --bin anti-ahmad-bot
WORKDIR /anti-ahmad-bot
COPY ./Cargo.lock ./Cargo.lock
COPY ./Cargo.toml ./Cargo.toml

# this build step will cache your dependencies
RUN cargo build --release
RUN rm src/*.rs

# copy source tree
ADD ./src ./src

# build for release
# why is it making it an underscore???
# https://github.com/rust-lang/cargo/issues/2775 looks into it. Seems like cargo is agnostic towards hyphens and underscores.
RUN rm ./target/release/deps/anti_ahmad_bot*
RUN cargo build --release

# installs dumb-init 
FROM alpine:3.13.5 as installer

RUN apk update
RUN apk add wget

# Install dumb-init
RUN wget -O /usr/local/bin/dumb-init https://github.com/Yelp/dumb-init/releases/download/v1.2.5/dumb-init_1.2.5_x86_64
RUN chmod +x /usr/local/bin/dumb-init

# our final base
FROM debian:buster-slim

# copy the build artifact from the build stage
COPY --from=build /anti-ahmad-bot/target/release/anti-ahmad-bot .
# copies dumb-init from installer stage
COPY --from=installer /usr/local/bin/dumb-init .

# set the startup command to run your binary
CMD ["./dumb-init", "./anti-ahmad-bot"]