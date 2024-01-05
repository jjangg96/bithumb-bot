FROM node:slim

ARG DISABLE_CACHE
WORKDIR /root

RUN apt update && apt install git -y
COPY root/ /root/
COPY .git/ /root/.git/
RUN npm i

ENTRYPOINT ["/root/entrypoint.sh"]