FROM node:16-bullseye-slim

# install dumb init for better SIGINT handling
# also install open-ssl since prisma needs it - https://github.com/prisma/prisma/issues/16232
RUN apt-get update && apt-get install -y dumb-init openssl && rm -rf /var/lib/apt/lists/*

RUN sudo apt-get update && \
    sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev -y

WORKDIR /project
COPY package.json package-lock.json prisma ./
RUN npm ci

COPY . .
# we prune production here to make the size smaller
# but as a note, prisma is included in the "production" dependencies
# https://www.prisma.io/docs/guides/deployment/deploy-database-changes-with-prisma-migrate
RUN npm run build && npm prune --production
CMD [ "/usr/bin/dumb-init", "--", "npm", "run", "start" ]
