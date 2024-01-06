#!/bin/sh

echo "Update notes"
git log --pretty=format:"%ch - %s"  | head --lines 4

exec pm2-runtime /usr/local/bin/npm -- run start
