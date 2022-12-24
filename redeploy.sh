# redeploy bot on the server
git fetch && git reset origin/main --hard

docker compose down
docker compose up -d --build
