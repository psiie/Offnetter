const async = require("async");
const path = require("path");
const download = require("download");
const cheerio = require("cheerio");
const fs = require("fs");
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
  PROCESSED_WIKI_DL,
  CONCURRENT_CONNECTIONS,
  IMAGE_EXTENSIONS,
  REPLACE_CSS_CLASSES_IDS,
  WIKI_DL
} = require("./config");

function modifyHtml(zimList) {
  function cleanSingleFile(file, callback) {
    const saveFile = (filename, html, callback) => {
      const filePath = path.join(PROCESSED_WIKI_DL, filename + ".html");
      fs.writeFile(filePath, html, "utf8", err => {
        if (err) console.log("err writing html file", filename);
        callback();
      });
    };

    const replaceCssIds = (file, $, callback) => {
      if (!REPLACE_CSS_CLASSES_IDS) {
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
      }

      const $ = cheerio.load(html);
      let links = [];
      let anchorCounter = 0;

      const $a = $("a");
      console.log(
        `${logCounter}/${Object.keys(zimList).length} | Cleaning file: ${file}.html | ${$a.length} links`
      );
      $("script").remove();
      $("noscript").remove();
      $("link").remove();
      $("#mw-navigation").remove(); // left/top banner and sidebar
      $("#mw-editsection").remove(); // edit buttons next to articles
      $("head").append('<link rel="stylesheet" href="index.css">');
      $("img").each(function() {
        const oldSrc = $(this).attr("src");
        const imageFilename = getFilename(oldSrc);
        const newSrc = path.join(RELATIVE_SAVE_PATH, imageFilename);
        $(this).attr("src", newSrc);
      });
      $a.each(function() {
        let oldSrc = $(this).attr("href");
        if (oldSrc && oldSrc[0] === "#") return; // Dont modify if the link is a page anchor
        let ext = oldSrc && oldSrc.split(".").slice(-1)[0];
        oldSrc = cleanListOfLinks([oldSrc])[0];
        oldSrc = oldSrc && oldSrc.replace("//", "");

        // --- DEBUG for extra slow processing --- //
        // process.stdout.clearLine();
        // process.stdout.cursorTo(0);
        // process.stdout.write(`  ┗ ${anchorCounter}/${$a.length} | ${oldSrc}`);
        // anchorCounter++;

        // // If link is in the zim, update the relative path. If not, remove the <a> tag
        // IMAGE_EXTENSIONS.indexOf(ext) === -1
        const linkIsInZim = oldSrc && !IMAGE_EXTENSIONS[ext] && zimList[oldSrc];
        if (linkIsInZim) {
          const newSrc = oldSrc ? oldSrc + ".html" : "#";
          $(this).attr("href", newSrc);
        } else {
          const innerText = $(this).text();
          $(this).replaceWith(innerText);
        }
      });

      replaceCssIds(file, $, callback);
      // saveFile(file, $.html(), callback);
    });
  }

  const queue = async.queue(cleanSingleFile, 1); // Can only be 1 concurrency here
  queue.push(Object.keys(zimList));
  queue.drain = () => {
    console.log("All html files modified");
  };
}

// --- Init --- //

/* Examine the output folder and remove that from the list of
html files to process. This is resuming progress */
console.log("Reading directory of already processed html");
let logCounter = 0;
let alreadyProcessedFiles = fs.readdirSync(PROCESSED_WIKI_DL);
alreadyProcessedFiles = alreadyProcessedFiles.filter(
  file => file.split(".").slice(-1)[0] === "html"
);
alreadyProcessedFiles = alreadyProcessedFiles.map(
  file => file.split(".").slice(0, -1)[0]
);
console.log("Loading the 'wiki_list.lst'");
loadListFile(WIKI_LIST).then(zimList => {
  console.log("filtering and optimizing list to save time later");

  let optimizedZimList = {}; // Using binary search tree for extra speed later on
  zimList.forEach((item, idx) => {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`  ┗ ${idx}/${zimList.length}`);
    if (alreadyProcessedFiles.indexOf(item) === -1) optimizedZimList[item] = 1;
  });

  console.log("Wiki List Loaded. Starting article processing");
  modifyHtml(optimizedZimList);
});
