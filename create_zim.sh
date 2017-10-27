#!/bin/bash
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