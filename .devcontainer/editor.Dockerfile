FROM mcr.microsoft.com/devcontainers/javascript-node:0-16-bullseye

# required for chartjs-node-canvas on arm machines
# https://github.com/SeanSobey/ChartjsNodeCanvas/issues/107#issuecomment-1185438310
# https://github.com/Automattic/node-canvas/wiki/Installation%3A-Ubuntu-and-other-Debian-based-systems
# Since I am deploying this project to my Digital ocean droplet (x86), I don't need to install these in the actual dockerfile
RUN sudo apt-get update && \
    sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev -y

RUN mkdir -p /home/node/.config/gh && chown -R node:node /home/node/.config