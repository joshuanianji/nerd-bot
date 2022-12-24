FROM node:16-bullseye-slim

# install dumb init for better SIGINT handling
# also install open-ssl since prisma needs it - https://github.com/prisma/prisma/issues/16232
RUN apt-get update && apt-get install -y dumb-init openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /project
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build && npm prune --omit-dev
CMD [ "/usr/bin/dumb-init", "--", "node", "build/index.js" ]
