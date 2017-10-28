#!/bin/bash
# Check if Root. If not, quit.
if [ "$(id -u)" != "0" ]; then
   echo "This script must be run as root" 1>&2
   exit 1
fi

# "2017-10-25_0218.zim"

# IMG="output/" + $1
exec docker run -v $(pwd)/output:/output -p 8009:8009 darkenvy/kiwix-serve ./kiwix-serve --port=8009 /output/$1 &

echo 'Waiting 5 seconds for container to boot'
sleep 5s
echo 'Continuing...'
node test_zim.js $2

echo "Done. Stopping the container. May take up to 30 seconds"
docker stop `docker ps -lq --filter="publish=8009"`