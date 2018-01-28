#!/bin/bash
echo "Starting conversion of images!"

cd sample_folder/
echo "Converting jpeg files first."
find . -type f -iname "*.jp*g" -print0 | xargs -0 -n1 -P16 -I {} /bin/bash -c 'bash ../modules/singleImageProcess.sh jpg "{}" > /dev/null 2>&1'

echo "Converting gif images second."
find . -type f -iname "*.gif" -print0 | xargs -0 -n1 -P16 -I {} /bin/bash -c 'bash ../modules/singleImageProcess.sh gif "{}" > /dev/null 2>&1'

echo "Converting png images last."
find . -type f -iname "*.png" -print0 | xargs -0 -n1 -P16 -I {} /bin/bash -c 'bash ../modules/singleImageProcess.sh png "{}" > /dev/null 2>&1'

echo "Done!"