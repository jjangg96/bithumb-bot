#!/bin/bash

docker buildx build . --push --load --platform linux/amd64 --build-arg DISABLE_CACHE="$(date +%s)" -t "jjangg96/bithumb-bot:latest" $2