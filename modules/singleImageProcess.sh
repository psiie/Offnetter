#!/bin/bash
# echo "  -input $1"

# regex remove the "./" from the begining of filenames
filetype=$1
filename=$2
re='^\.\/(.+)'
while [[ $filename =~ $re ]]; do
    filename=${BASH_REMATCH[1]}
done

# current working directory will be that of samplefolder/ due to this script being executed from there
if [ "$filetype" = "jpg" ];
then
    convert -quiet "$filename" -strip -interlace Plane -colorspace RGB -resize 50% -quality 50 "../sample_out/$filename"
elif [ "$filetype" = "png" ];
then
    pngquant "$filename" --quality="0-10" --speed=1 --nofs --posterize=4 --floyd=1 --skip-if-larger --force --output "../sample_out/$filename"
elif [ "$filetype" = "gif" ];
then
    gifsicle "$filename" --no-app-extensions --no-extensions --no-comments --no-names --colors="64" --use-colormap="web" --optimize="3" --scale=0.5 --resize-colors=64 --no-warnings --output "../sample_out/$filename"
fi



# if the convertion wasnt successful, copy the original file over
if [ ! $? -eq 0 ];
then
    echo "  -error $filename"
    cp "$filename" "../sample_out/$filename"
fi
