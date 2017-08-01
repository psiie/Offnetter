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
  3. node crossReferenceLinks.js
  4. node processHtml.js
  5. node processImages.js
  6. node createIndex.js
  7. ./zimwriterfs.sh
  8. Profit??

## Multitasking
After you successfully `node pullArticles`, you can `node pullImages.js` at the same time as `node crossReferenceLinks.js`. 

`node crossReferenceLinks.js` can be done at the same time as `node processImages`.

`node processImages.js` can be done at the same time as `node creatIndex.js`