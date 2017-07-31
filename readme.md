# mwOffnet
An optimized way to download a MediaWiki

## Be sure to
Make the following folders:
  * `raw_wiki_articles`
  * `selections`

Edit `config.js` to reference your wiki_list.lst file path (which will be inside selections/)

You can delete `missing_*.txt` at any time. It is for your reference to `tail -f`.

## Order of operations
  1. node pullArticles.js
  2. node pullImages.js
  3. processArticles.js
  4. ./zimwriterfs.sh
  5. Profit??