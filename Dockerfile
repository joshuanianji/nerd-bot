FROM node:20-bullseye-slim

# install dumb init for better SIGINT handling
# also install open-ssl since prisma needs it - https://github.com/prisma/prisma/issues/16232
RUN apt-get update && apt-get install -y ca-certificates dumb-init openssl build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev wget lsb-release && rm -rf /var/lib/apt/lists/*

# Install postgresql client 15 for pg_dump commands (since we're using postgres 15 as our database)
# https://nextgentips.com/2022/10/14/how-to-install-and-configure-postgresql-15-on-debian-11/
RUN sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main 15" > /etc/apt/sources.list.d/pgdg.list' \
    && wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - \
    && apt-get update && apt-get -y install postgresql-client-15 && rm -rf /var/lib/apt/lists/*

WORKDIR /project
COPY package.json package-lock.json prisma ./
RUN npm ci

COPY . .
# we prune production here to make the size smaller
# but as a note, prisma is included in the "production" dependencies
# https://www.prisma.io/docs/guides/deployment/deploy-database-changes-with-prisma-migrate
RUN npm run build && npm prune --production
CMD [ "/usr/bin/dumb-init", "--", "npm", "run", "start" ]
