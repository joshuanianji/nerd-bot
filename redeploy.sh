# redeploy bot on the server
git fetch && git reset origin/main --hard

docker compose -f docker-compose.yml -f docker-compose.prod.yml down
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
# run prisma migrations - https://www.prisma.io/docs/guides/deployment/deploy-database-changes-with-prisma-migrate
docker compose exec bot npx prisma migrate deploy