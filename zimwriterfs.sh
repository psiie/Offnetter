#!/bin/bash
sudo docker build -t zimwriterfs zimwriterfs_config
sudo docker run -it -v $(pwd)/postprocessed_wiki_articles:/articles -v $(pwd)/output:/output -v /etc/localtime:/etc/localtime:ro zimwriterfs