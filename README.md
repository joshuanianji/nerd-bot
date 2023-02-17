# Nerd Bot

A discord bot that ranks users based on their nerd score. Calculated by the number of nerd reacts they give and receive to other people via discord message reactions.

## Running Locally

First, create a `.env.` file in the root of the project by copying the `.env.example` file. Then, fill in the values for the environment variables.

Then, you can open up the project in your devcontainer. Devcontainers sets up the environment via docker-compose with the following services:

- Postgres 15 Database
- PGAdmin4 v6 (database admin) - accessible via [http://localhost:5050](http://localhost:5050)
- Node 16 (devcontainer workspace)

Upon running PGAdmin the first time, add a server with the following settings: ([source](https://stackoverflow.com/a/51172659))

- Host: `db`
- Port: `5432`
