FROM node:16-bullseye-slim

# install dumb init and open-ssl
RUN apt-get update && apt-get install -y dumb-init openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build && npm prune --production
CMD [ "/usr/bin/dumb-init", "--", "node", "build/index.js" ]
