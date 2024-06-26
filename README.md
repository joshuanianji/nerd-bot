# Nerd Bot

A discord bot that ranks users based on their nerd score. Calculated by the number of nerd reacts they give and receive to other people via discord message reactions.

Written in Typescript, using Prisma + Postgres. Currently deployed to my oracle VPS.

## Features

Nerd Bot is configured for the following slash commands:

- `/botstat` - Basic stats about the bot
- `/vmstat` - Basic stats about the computer running the bot
- `/stat` - Nerd stats of the user who ran the command
- `/stat @user` - Nerd stats of the mentioned user
- `/plt me` - Plots the nerd stats over time of the user who ran the command
- `/plt user @user` - Plots the nerd stats over time of the mentioned user
- `/plt two @user1 @user2` - Plots two users' nerd stats over time

## Running Locally

First, create a `.env` file in the root of the project by copying the `.env.example` file. Then, fill in the values for the empty environment variables.

Then, you can open up the project in your devcontainer. Devcontainers sets up the environment via docker-compose with the following services:

- Postgres 15 Database
- Node 16 (devcontainer workspace)

### Seeding the database

Inside `prisma/seed.dev.ts`, there is a small script that does some initial seeding of the database. You can run this script by running the following command (assuming you're okay with resetting the database). Without any arguments, it will seed the database for 2 users with 20 messages and reactions each.

```bash
npm run seed
```

Further arguments can be provided:

```bash
npm run seed -- null # no users nor messages
npm run seed -- basic # 2 users, but only one reaction
npm run seed -- lopsided # 2 users, but one user has 10 reactions
npm run seed -- prod # copy of production database: ./prisma/prod.sql
```
