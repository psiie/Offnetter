# mwOffnet
An optimized way to download a MediaWiki

## Be sure to
Make the following folders:
  * `raw_wiki_articles`
  * `selections`
  * `processed_wiki_articles`
  * `processed_wiki_articles/images`

Edit `config.js` to reference your wiki_list.lst file path (which will be inside selections/)

You can delete `missing_*.txt` at any time. It is for your reference to `tail -f`.

## Order of operations
  1. node pullArticles.js
  2. node pullImages.js
  3. node processArticles.js
  4. node processImages.js
  5. node createIndex.js
  6. ./zimwriterfs.sh
  7. Profit??