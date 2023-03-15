# Nerd Bot

A discord bot that ranks users based on their nerd score. Calculated by the number of nerd reacts they give and receive to other people via discord message reactions.

Written in Typescript and uses Prisma + Postgres. Currently deployed to my Digital Ocean Droplet.

## Running Locally

First, create a `.env` file in the root of the project by copying the `.env.example` file. Then, fill in the values for the empty environment variables.

Then, you can open up the project in your devcontainer. Devcontainers sets up the environment via docker-compose with the following services:

- Postgres 15 Database
- PGAdmin4 v6 (database admin) - accessible via [http://localhost:5050](http://localhost:5050)
    - Username: `admin@admin.com`
    - Password: `admin`
- Node 16 (devcontainer workspace)

Upon running PGAdmin the first time, add a server with the following settings: ([source](https://stackoverflow.com/a/51172659))

- Name: whatever you want
- Connection > Host: `db`
- Connection > Port: `5432`
- Connection > User: `postgres`
- Connection > Password: `admin`

### Seeding the database

Inside `prisma/seed.dev.ts`, there is a small script that does some initial seeding of the database. You can run this script by running the following command (assuming you're okay with resetting the database)

```bash
NODE_ENV=development npx prisma migrate reset
```

## Usage

Nerd Bot is configured for the following slash commands:

- `/botstat` - Basic stats about the bot
- `/vmstat` - Basic stats about the computer running the bot
- `/stat` - Nerd stats of the user who ran the command
- `/stat @user` - Nerd stats of the mentioned user
