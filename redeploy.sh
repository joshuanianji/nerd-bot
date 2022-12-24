# redeploy bot on the server
git fetch && git reset origin/main --hard

docker compose -f docker-compose.yml -f docker-compose.prod.yml down
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
