# Production dockerfile
# context is this /voice directory

FROM node:16-alpine3.12 AS builder

WORKDIR /app

COPY ["package.json", "package-lock.json", "./"]
RUN npm i --production

COPY . .
# we use @vercel/ncc to compile the code into a single .js file
RUN npm run build

# Start the app
# Copy over `build/index.js` 
FROM ghcr.io/joshuanianji/scratch-node-dumb-init:16.12.0 as runner
WORKDIR /app
COPY --from=builder /app/build/index.js ./

CMD ["node", "index.js"]
