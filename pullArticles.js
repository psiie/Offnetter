const async = require("async");
const path = require("path");
const download = require("download");
const realFs = require("fs");
let fs = require("graceful-fs");
fs.gracefulify(realFs);

let CONCURRENT_CONNECTIONS = 4;
const WIKI_DL = path.join(__dirname, "raw_wiki_articles");
let MEDIA_WIKI = "https://en.wikipedia.org/wiki/";
/* --- Notes about imports --- 
I am using the module graceful-fs which patches fs to fix problems with 
concurrent-open-file-limits. fs seems to not close files soon enough and
causes a race condition. Lets see if we can remove it as time goes on.

Only ever saw this error when writing 54k empty files at once (using 
async concurrency of 1)
*/

function loadListFile(filename) {
  /* We must load in the list to be processed before downloading */
  return new Promise(resolve => {
    const wikiList = [];
    const lineReader = require("readline").createInterface({
      input: require("fs").createReadStream(path.join(__dirname, filename))
    });

    lineReader.on("line", line => wikiList.push(line));
    lineReader.on("close", () => resolve(wikiList));
  });
}

function downloadWikiArticles(articleListArr) {
  function processArticle(article, callback) {
    /* Check for file access. If the process returns an error, this means
    the file doesn't exist. So lets download the article! Otherwise, skip */
    const filePath = path.join(WIKI_DL, article + ".html");
    fs.access(filePath, fs.constants.R_OK, err => {
      if (err) console.log("downloading", article);
      else console.log("skipping", article);
      err ? getArticle(article, callback) : callback();
    });
  }

  // Do the actual downloading
  function getArticle(article, callback) {
    const url = MEDIA_WIKI + article;
    const filePath = path.join(WIKI_DL, article + ".html");
    download(url)
      .then(html => fs.writeFile(filePath, html, callback))
      .catch(err => {
        // Push article back on the queue if it is a 429 (too many requests)
        if (err.statusCode === 429) {
          console.log("pushing", article, "back on the queue");
          queue.push(article);
        }
        console.log("   ", err.statusCode, article);

        // Write error out to file
        const ERR_FILE = path.join(__dirname, "missing_articles.txt");
        fs.appendFile(ERR_FILE, `${err.statusCode} ${article}\n`, err => {
          if (err) console.log("problems appending to error file", err);
          callback();
        });
      });
  }

  /* Initialize a queue that limits concurrent downloads. The queue will 
  automatically start processing. Upon finish, the drain function will run */
  const queue = async.queue(processArticle, CONCURRENT_CONNECTIONS);
  queue.push(articleListArr);
  queue.drain = () => {
    console.log("All articles downloaded");
  };
}

// ---------- Init ---------- //
const CMD_ARGS = process.argv;
if (CMD_ARGS.length < 3) {
  console.log("node pullArticles.js wiki_list.lst");
  console.log(
    "node pullArticles.js wiki_list.lst https://fr.wikipedia.org/wiki/"
  );
  console.log("\nPlease specify a list file to download");
  console.log("As well as a mediawiki (default: en wikipedia)");
  console.log("The file should be a textfile that is newline deliminated");
  console.log("One Article Per Line");
} else {
  if (CMD_ARGS.length > 3) MEDIA_WIKI = CMD_ARGS[3];
  const WIKI_LIST = CMD_ARGS[2];
  loadListFile(WIKI_LIST).then(downloadWikiArticles);
}
