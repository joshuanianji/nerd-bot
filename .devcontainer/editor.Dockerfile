FROM mcr.microsoft.com/devcontainers/javascript-node:1-20-bullseye

# required for chartjs-node-canvas on arm machines
# https://github.com/SeanSobey/ChartjsNodeCanvas/issues/107#issuecomment-1185438310
# https://github.com/Automattic/node-canvas/wiki/Installation%3A-Ubuntu-and-other-Debian-based-systems
# Since I am deploying this project to my Digital ocean droplet (x86), I don't need to install these in the actual dockerfile
RUN sudo apt-get update && \
    sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev -y

# postgresql client 15 for pg_dump commands (since we're using postgres 15 as our database)
# https://nextgentips.com/2022/10/14/how-to-install-and-configure-postgresql-15-on-debian-11/
RUN sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main 15" > /etc/apt/sources.list.d/pgdg.list' \
    && wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add - \
    && sudo apt update && sudo apt-get -y install postgresql-client-15
