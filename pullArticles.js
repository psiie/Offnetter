const async = require("async");
const path = require("path");
const download = require("download");
const fs = require("graceful-fs");
const { loadListFile } = require("./_helper");
const { CONCURRENT_CONNECTIONS, WIKI_DL, MEDIA_WIKI, WIKI_LIST, LOG_MISSING } = require("./config");

/* --- Notes about imports --- 
I am using the module graceful-fs which patches fs to fix problems with 
concurrent-open-file-limits. fs seems to not close files soon enough and
causes a race condition. Lets see if we can remove it as time goes on.

Only ever saw this error when writing 54k empty files at once (using 
async concurrency of 1)
*/

// This delay mechanism is self-throttling when downloading from wikipedia
let delay429 = 0;
setInterval(() => {
  if (delay429 > 0) delay429 -= 1;
  if (delay429 < 0) delay429 = 0;
}, 5 * 60 * 1000);

// --------- Phase 2 --------- //
function downloadWikiArticles(articleListArr) {
  const startTime = Date.now() / 1000;
  let logCounter = 0;

  // --------- Phase 2.2 --------- //
  function getArticle(article, callback) {
    const url = MEDIA_WIKI + article;
    const filePath = path.join(WIKI_DL, article + ".html");
    download(url)
    .then(html => fs.writeFile(filePath, html, callback))
    .catch(err => {
      // Push article back on the queue if it is a 429 (too many requests)
      if (err.statusCode === 429) {
        console.log("\n429 pushing", article, "back on the queue. Delaying myself...");
        if (delay429 < 3) delay429 += 1;
        queue.push(article);
      } else if (LOG_MISSING && err.statusCode !== 429) { // Write error out to file
        const ERR_FILE = path.join(__dirname, "missing_articles.txt");
        fs.appendFile(ERR_FILE, `${err.statusCode} ${article}\n`, err => {
          if (err) console.log("problems appending to error file", err);
          setTimeout(callback, 1000 * delay429);
        });
      } else setTimeout(callback, 1000 * delay429);
    });
  }

  // --------- Phase 2.1 --------- //
  function processArticle(article, callback) {
    /* Check for file access. If the process returns an error, this means
    the file doesn't exist. So lets download the article! Otherwise, skip */
    logCounter++;
    const filePath = path.join(WIKI_DL, article + ".html");
    fs.access(filePath, fs.constants.R_OK, err => {
      const timeDiff = Date.now() / 1000 - startTime;
      const timePer = timeDiff / logCounter;
      const timeRemaining = (articleListArr.length - logCounter) * timePer;
      const hoursRemaining = parseInt(timeRemaining / 60 / 60);
      const minutesRemaining = parseInt(timeRemaining / 60 % 60);
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(
        err
          ? `  ┗ ${hoursRemaining}:${minutesRemaining} | ${logCounter}/${articleListArr.length} | downloading ${article.slice(0,40)}`
          : `  ┗ ${hoursRemaining}:${minutesRemaining} | skipping ${article.slice(0,40)}`
      );

      err ? getArticle(article, callback) : callback();
    });
  }

  /* Initialize a queue that limits concurrent downloads. The queue will 
  automatically start processing. Upon finish, the drain function will run */
  const queue = async.queue(processArticle, CONCURRENT_CONNECTIONS);
  queue.push(articleListArr);
  queue.drain = () => {
    console.log("All articles downloaded");
    process.exit();
  };
}

// ---------- Phase 1 ---------- //
loadListFile(WIKI_LIST).then(downloadWikiArticles);
