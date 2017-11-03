const async = require("async");
const path = require("path");
const download = require("download");
const cheerio = require("cheerio");
const fs = require("graceful-fs");
const tidy = require("htmltidy").tidy;
const { loadListFile, getFilename, cleanListOfLinks, cssIds, cssClasses } = require("./_helper");
const {
  WIKI_LIST,
  RELATIVE_SAVE_PATH,
  PROCESSED_WIKI_DL,
  CONCURRENT_CONNECTIONS,
  IMAGE_EXTENSIONS,
  WIKI_DL
} = require("./config");

function modifyHtml(zimList) {
  const startTime = Date.now() / 1000;
  const totalCount = Object.keys(zimList).length;
  function cleanSingleFile(file, callback) {
    const saveFile = (filename, html, callback) => {
      const filePath = path.join(PROCESSED_WIKI_DL, filename + ".html");
      fs.writeFile(filePath, html, "utf8", err => {
        if (err) console.log("err writing html file", filename);
        callback();
      });
    };

    logCounter++;
    const filePath = path.join(WIKI_DL, file + ".html");
    fs.readFile(filePath, "utf8", (err, html) => {
      const timeDiff = Date.now() / 1000 - startTime;
      const timePer = timeDiff / logCounter;
      const timeRemaining = (totalCount - logCounter) * timePer;
      const hoursRemaining = parseInt(timeRemaining / 60 / 60);
      const minutesRemaining = parseInt(timeRemaining / 60 % 60);
      if (err) {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(`  ┗ ${hoursRemaining}:${minutesRemaining} | Not Found: ${file}`);
        callback();
        return;
      } else {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(
          `  ┗ ${hoursRemaining}:${minutesRemaining} | ${logCounter}/${totalCount} | Processing ${file.slice(0, 40)}`
        );
      }

      let newHtml = html;

      /* Remove tags (script, link, meta ) */
      newHtml = newHtml.replace(/<script.*?\/>/g, "");
      newHtml = newHtml.replace(/<link.*?\/>/g, "");
      newHtml = newHtml.replace(/<meta.*?\/>/g, "");
      newHtml = newHtml.replace(/<script(.|[\n\t])*?>(.|[\n\t])*?<\/\s?script>/g, "");

      // inject index.css
      newHtml = newHtml.replace(/<\/\s?head>/, m => {
        return `<link rel="stylesheet" href="index.css" /> ${m}`;
      });

      newHtml = newHtml.replace(/<a\s+?href="([^\s]*?)".*?>(.*?)<\/\s?a>/g, (m, a, b) => {
        // dont touch anything if an anchor
        if (a[0] === "#") return m;
        // Shorten to a relative path and add .html
        const href = a.split("/").slice(-1)[0];
        if (zimList[href]) return `<a href="${href}.html">${b}</a>`;
        else return `<span>${b}</span>`;
      });

      // Fix images so they show up
      newHtml = newHtml.replace(/img.+src="(.+?)"/g, (m, a) => {
        let newLink = a.split("/").slice(-1)[0];
        if (newLink.length > 32 && newLink.split(".").length === 1) {
          newLink += ".svg";
        }
        if (/%/.test(newLink)) newLink = decodeURI(newLink).replace(/%/g, '');
        return `img src="images/${newLink}" onerror="this.style.display='none'"`;
      });

      /* Remove sidebar - Goes from #mw-navigation to #footer. Litterally
      deletes everything in between. #mw-navigation typically is at the end */
      newHtml = newHtml.replace(/<div.+id="mw-navigation"(?:.|[\r\n])+?<div.+id="footer"/, '<div id="footer"');
      
      // Set charset
      newHtml = newHtml.replace(/<head>/, '<head><meta charset="UTF-8">');

      saveFile(file, newHtml, callback);
    });
  }

  // -- process queue setup -- //
  const zimListArr = Object.keys(zimList);
  const queue = async.queue(cleanSingleFile, 1); // Can only be 1 concurrency here
  queue.drain = () => console.log("\nAll html files modified");

  // -- Payload Chunking -- //
  /* Due to the queue size having an upper bounds of ~1.2M, we chunk the
  incoming array into bite-sized pieces. This way we continually feed the queue.
  
  If the incoming array is below the specified chunk size (50k default) then
  just add them all in one go. No need for this nonsense. */
  const chunk = 500 * 1000; // 500k
  const largePayloadChunker = () => {
    console.log('Article list greater than 500k. Chunking... ETA will extend at intervals');
    let intervalId;
    const pushEnd = () => queue.push(zimListArr.splice(zimListArr.length - chunk - 1, chunk));
    const checkQueueReady = () => {
      if (zimListArr.length === 0) clearInterval(intervalId);
      else if (queue.length() < 10000) pushEnd();
    }
    pushEnd(); // push initial chunk onto array (else checkQueueReady() will quit early)
    intervalId = setInterval(checkQueueReady, 1000);
  }
  if (zimListArr.length > chunk) largePayloadChunker();
  else queue.push(zimListArr);
}

// --- Init --- //

/* Examine the output folder and remove that from the list of
html files to process. This is resuming progress. Because Javascript
doesn't have hashes like Ruby, this looks more complicated than it is. We
use Objects like we would Arrays. This increases speed using BinarySearchTrees */
let logCounter = 0;

console.log("Reading directory of already processed html");
fs.readdir(PROCESSED_WIKI_DL, (err, alreadyProcessedFiles) => {
  if (err) {
    console.log("Fatal. Cannot read PROCESSED_WIKI_DL directory");
    return;
  }
  /* We load the list of files into a hashmap. Javascript doesn't have hashmaps
  per-say so we use objects instead. This requires filters/map */
  if (!alreadyProcessedFiles) alreadyProcessedFiles = [];
  let optimAlreadyProcessedFiles = {};
  alreadyProcessedFiles
    .filter(file => file.split(".").slice(-1)[0] === "html")
    .map(file => file.split(".").slice(0, -1)[0])
    .forEach(file => optimAlreadyProcessedFiles[file] = 1);
  console.log("Loading the 'wiki_list.lst'");

  loadListFile(WIKI_LIST).then(zimList => {
    console.log("filtering and optimizing list to save time later");
    let optimizedZimList = {};
    zimList.forEach((item, idx) => {
      // boilerplate single-line-console-logging
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(`  ┗ ${idx}/${zimList.length}`);
      if (!optimAlreadyProcessedFiles[item]) optimizedZimList[item] = 1;
    });

    console.log("\nWiki List Loaded. Starting article processing", optimizedZimList.length);
    modifyHtml(optimizedZimList);
  });
});
