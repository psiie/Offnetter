# mwOffnet
An optimized way to download a MediaWiki

Edit `config.js` to reference your wiki_list.lst file path (which will be inside selections/)

You can delete `missing_*.txt` at any time. It is for your reference to `tail -f`.

## One time install
 * sudo apt-get install imagemagick graphicsmagick
 * npm install

## Order of operations
  1. ./prep.sh
  2. node pullArticles.js
  3. node pullImages.js
  4. node processArticles.js
  6. node processImages.js
  7. node createIndex.js
  8. ./prepare_zimwriterfs.sh
  8. ./zimwriterfs.sh
  9. Profit??

## Todo
  * Add timeout for when a 'too fast' statuscode appears.

## Known Problems
  * ~processImages can't handle 32755 encodings on a NUC. Claims 'too many files open'. Fixed on OSX by using graceful-fs but still broken on linux.~