#!/bin/bash
echo "Start!"

cd raw_wiki_articles/images
find . -type f -iname "*.jp*g" -print0 | xargs -0 -n1 -P16 -I {} /bin/bash -c 'convert "{}" -strip -interlace Plane -colorspace RGB -quality 50 "../../processed_wiki_articles/images/{}"'

find . -type f -iname "*.gif" -print0 | xargs -0 -n1 -P16 -I {} /bin/bash -c 'gifsicle "{}" --no-app-extensions --no-extensions --no-comments --no-names --colors="64" --use-colormap="web" --optimize="3" --no-warnings -o "../../processed_wiki_articles/images/{}"'

find . -type f -iname "*.png" -print0 | xargs -0 -n1 -P16 -I {} /bin/bash -c 'pngquant "{}" --quality="0-10" --speed=10 --nofs --posterize=4 --skip-if-larger --output "../../processed_wiki_articles/images/{}"'

echo "Done!"

#  sed "s/'/\\\'/g"