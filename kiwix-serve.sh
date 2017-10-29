#!/bin/bash
CMD=$@

# Check if Root. If not, quit.
if [ "$(id -u)" != "0" ]; then
   echo "This script must be run as root" 1>&2
   exit 1
fi

# If no parameters are passed in, then use the latest zim created
if [ -z "$1" ]
then
  echo "No zim specified so kiwix-serve will serve the most recent on :8009"
  docker run -v $(pwd)/mount:/mount -p 8009:8009 darkenvy/kiwix-serve ./kiwix-serve --port=8009 /mount/`ls -t mount | head -1`
elif [ $1 = 'stop' ]
then
  echo "Stopping. May take up to 30 seconds"
  docker stop `sudo docker ps -lq --filter="publish=8009"`
else
  echo "Serving $1 on :8009"
  docker run -v $(pwd)/mount:/mount -p 8009:8009 darkenvy/kiwix-serve ./kiwix-serve --port=8009 /$CMD
fi
