const async = require("async");
const path = require("path");
const download = require("download");
const cheerio = require("cheerio");
const fs = require("fs");
const tidy = require("htmltidy").tidy;
const {
  loadListFile,
  getFilename,
  cleanListOfLinks,
  cssIds,
  cssClasses
} = require("./_helper");
const {
  WIKI_LIST,
  RELATIVE_SAVE_PATH,
  PRE_PROCESSED_WIKI_DL,
  CONCURRENT_CONNECTIONS,
  IMAGE_EXTENSIONS,
  REPLACE_CSS_CLASSES_IDS,
  WIKI_DL
} = require("./config");

function modifyHtml(zimList) {
  function cleanSingleFile(file, callback) {
    const saveFile = (filename, html, callback) => {
      const filePath = path.join(PRE_PROCESSED_WIKI_DL, filename + ".html");
      fs.writeFile(filePath, html, "utf8", err => {
        if (err) console.log("err writing html file", filename);
        callback();
      });
    };

    const replaceCssIds = (file, $, callback) => {
      if (REPLACE_CSS_CLASSES_IDS) {
        // Classes
        for (let hClass in cssClasses) {
          let $items = $(`.${hClass}`);
          if ($items.length > 0) $items.attr("class", cssClasses[hClass]);
        }
        // Ids
        for (let ids in cssIds) {
          let $items = $(`#${ids}`);
          if ($items.length > 0) $items.attr("id", cssIds[ids]);
        }
      }
      saveFile(file, $.html(), callback);
    };

    logCounter++;
    const filePath = path.join(WIKI_DL, file + ".html");
    fs.readFile(filePath, "utf8", (err, html) => {
      if (err) {
        console.log(`Not Found: ${file}`);
        callback();
        return;
      } else {
        console.log(
          `${logCounter}/${Object.keys(zimList).length} | Processing ${file}`
        );
      }

      // Fix up links
      let newHtml = html;
      newHtml = newHtml.replace(/href="\/wiki\/([^\s]+)?"/g, (m, a) => {
        if (zimList[a]) return `href="${a}.html"`;
        else if (/(jpg|png|svg|gif)/.test(a))
          return `href="images/${a}"`; // may need to remove the "File:"
        else return "";
      });
      newHtml = newHtml.replace(/href="[^#][^\s]+"/g, (m, a) => {
        if (/(https?|\.com|\.org|\.php|\.net)/.test(m)) return "";
        else return m;
      });

      saveFile(file, newHtml, callback);
    });
  }

  const zimListArr = Object.keys(zimList);
  // console.log(zimListArr.length);
  console.log("1", zimListArr.length);
  const queue = async.queue(cleanSingleFile, 1); // Can only be 1 concurrency here
  queue.push(zimListArr);
  queue.drain = () => {
    console.log("All html files modified");
  };
}

// --- Init --- //

/* Examine the output folder and remove that from the list of
html files to process. This is resuming progress. Because Javascript
doesn't have hashes like Ruby, this looks more complicated than it is. We
use Objects like we would Arrays. This increases speed using BinarySearchTrees */
let logCounter = 0;

console.log("Reading directory of already processed html");
fs.readdir(PRE_PROCESSED_WIKI_DL, (err, alreadyProcessedFiles) => {
  if (err) {
    console.log("Fatal. Cannot read PRE_PROCESSED_WIKI_DL directory");
    return;
  }
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
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(`  ┗ ${idx}/${zimList.length}`);
      if (!optimAlreadyProcessedFiles[item]) optimizedZimList[item] = 1;
    });

    console.log("Wiki List Loaded. Starting article processing");
    modifyHtml(optimizedZimList);
  });
});
