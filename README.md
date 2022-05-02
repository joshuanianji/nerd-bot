# Anti Ahmad Bot

## Local Running

### With Docker

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### Without Docker

Don't do this! Environment variables won't work lol.
But, this is what I started out with.

```bash
cargo watch -x run -w src 
```
