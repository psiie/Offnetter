# mwOffnet
An optimized way to download a MediaWiki

## Be sure to
Make the following folders:
  * `raw_wiki_articles`
  * `selections`
  * `preprocessed_wiki_articles`
  * `preprocessed_wiki_articles/images`
  * `postprocessed_wiki_articles`
  * `postprocessed_wiki_articles/images`

Edit `config.js` to reference your wiki_list.lst file path (which will be inside selections/)

You can delete `missing_*.txt` at any time. It is for your reference to `tail -f`.

## Order of operations
  1. ./prep.sh
  2. node pullArticles.js
  3. node pullImages.js
  4. node processArticles.js
  5. gulp (optional. See `What is gulp` if you skip this step )
  6. node processImages.js
  7. node createIndex.js
  8. cp favicon.ico postprocessed_wiki_articles/favicon.ico
  9. ./zimwriterfs.sh
  10. Profit??

## What is gulp? Why Optional?
Gulp is a tool like node. Everything Gulp does is in streams. Due to tools that were accessible, it was easier to write this ONE tool in gulp. What does it do? It runs gulpfile.js which is written to clean up (broken tags, syntax) html and optimize CSS. It looks at all the css in the index.css and *.html files and renames the classes and Id's into base26 (.header => .a). Severe space savings can be had!

#### If you skip this step, you must do the following:
  1. `mv preprocessed_wiki_articles postprocessed_wiki_articles`
  2. `cp index.css postprocessed_wiki_articles/index.css`

## Multitasking
After you successfully `node pullArticles`, you can `node pullImages.js` at the same time as `node crossReferenceLinks.js`. 

`node crossReferenceLinks.js` can be done at the same time as `node processImages`.

`node processImages.js` can be done at the same time as `node creatIndex.js`

Do note however, that some tasks are internet hungry and others and cpu hungry. If you multitask two at the same time, they may fight for resources.

## Todo
  * Add timeout for when a 'too fast' statuscode appears.
  * processImages.js output seems to stick. Need to debounce debug output.