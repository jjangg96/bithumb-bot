FROM node:slim

WORKDIR /root

RUN apt update && apt install git -y
RUN npm install -g pm2 && pm2 install pm2-logrotate && pm2 set pm2-logrotate:rotateInterval '0 0 0 * *'
ARG DISABLE_CACHE

COPY root/ /root/
COPY .git/ /root/.git/
RUN npm i

ENTRYPOINT ["/root/entrypoint.sh"]