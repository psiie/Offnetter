#!/bin/bash
# Check if Root. If not, quit.
if [ "$(id -u)" != "0" ]; then
   echo "This script must be run as root" 1>&2
   exit 1
fi

# Change settings below
# Be sure to escape ALL quotemarks. event singlequotes
# This is due to "$@" or "$1" not preserving quotes in shell scripts

./zimwriterfs \
\
--language=fr \
--title=\"Wikipédia\" \
--description=\"L\'encyclopédie\ libre\" \
--publisher=\"Reno\ McKenzie\" \
\
--creator=\"wikipedia\" \
--tags=\"IIAB,\ Wikipedia,\ Interactive\" \
--favicon=favicon.ico \
--welcome=index.html \
--withFullTextIndex \
/input /output/$(date '+%Y-%m-%d_%H%M').zim
echo 'Completed'