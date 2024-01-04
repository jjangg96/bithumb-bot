FROM node:slim

ARG DISABLE_CACHE
WORKDIR /root
COPY root/ /root/
RUN npm i

ENTRYPOINT ["/usr/local/bin/npm" ,"run", "start"]