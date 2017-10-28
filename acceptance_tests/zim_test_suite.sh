#!/bin/bash
# Run this script with two parameters. Zimfile.zim and article_list.txt

# Check if Root. If not, quit.
if [ "$(id -u)" != "0" ]; then
   echo "This script must be run as root" 1>&2
   exit 1
fi

exec docker run -v $(pwd)/output:/output -p 8009:8009 darkenvy/kiwix-serve ./kiwix-serve --port=8009 /output/$1 &

echo 'Waiting 5 seconds for container to boot'
sleep 5s
echo 'Continuing...'
node $(pwd)/acceptance_tests/test_zim.js $2

echo "Done. Stopping the container. May take up to 30 seconds"
docker stop `docker ps -lq --filter="publish=8009"`