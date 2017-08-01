const async = require("async");
const path = require("path");
const download = require("download");
const cheerio = require("cheerio");
const fs = require("fs");
const { loadListFile, getFilename, cleanListOfLinks } = require("./_helper");
const {
  WIKI_LIST,
  RELATIVE_SAVE_PATH,
  PROCESSED_WIKI_DL,
  CONCURRENT_CONNECTIONS,
  IMAGE_EXTENSIONS,
  WIKI_DL
} = require("./config");

function modifyHtml(zimList) {
  function saveFile(filename, html, callback) {
    const filePath = path.join(PROCESSED_WIKI_DL, filename + ".html");
    fs.writeFile(filePath, html, "utf8", err => {
      if (err) console.log("err writing html file", filename);
      callback();
    });
  }

  function cleanSingleFile(file, callback) {
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
      console.log(`${logCounter}/${zimList.length} | Cleaning file: ${file}`);
      $("script").remove();
      $("noscript").remove();
      $("link").remove();
      $("head").append('<link rel="stylesheet" href="index.css">');
      $("img").each(function() {
        const oldSrc = $(this).attr("src");
        const imageFilename = getFilename(oldSrc);
        const newSrc = path.join(RELATIVE_SAVE_PATH, imageFilename);
        $(this).attr("src", newSrc);
      });
      $a.each(function() {
        let oldSrc = $(this).attr("href");
        let ext = oldSrc && oldSrc.split(".").slice(-1)[0];
        oldSrc = cleanListOfLinks([oldSrc])[0];
        oldSrc = oldSrc && oldSrc.replace("//", "");

        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(`  ┗ ${anchorCounter}/${$a.length} | ${oldSrc}`);
        anchorCounter++;
        // // If link is in the zim, update the relative path. If not, remove the <a> tag
        const linkIsInZim =
          oldSrc &&
          IMAGE_EXTENSIONS.indexOf(ext) === -1 &&
          zimList.indexOf(oldSrc) !== -1;
        // if (linkIsInZim) {
        //   const newSrc = oldSrc ? oldSrc + ".html" : "#";
        //   $(this).attr("href", newSrc);
        // } else {
        //   const innerText = $(this).text();
        //   $(this).replaceWith(innerText);
        // }
      });
      process.stdout.clearLine();
      process.stdout.cursorTo(0);

      saveFile(file, $.html(), callback);
    });
  }

  const queue = async.queue(cleanSingleFile, 1); // Can only be 1 concurrency here
  queue.push(zimList);
  queue.drain = () => {
    console.log("All html files modified");
  };
}

// --- Init --- //

/* Examine the output folder and remove that from the list of
html files to process. This is resuming progress */
let logCounter = 0;
let alreadyProcessedFiles = fs.readdirSync(PROCESSED_WIKI_DL);
alreadyProcessedFiles = alreadyProcessedFiles.filter(
  file => file.split(".").slice(-1)[0] === "html"
);
alreadyProcessedFiles = alreadyProcessedFiles.map(
  file => file.split(".").slice(0, -1)[0]
);

loadListFile(WIKI_LIST).then(zimList => {
  let filteredZimList = zimList.filter(
    file => alreadyProcessedFiles.indexOf(file) === -1
  );
  filteredZimList.sort();
  console.log("Wiki List Loaded. Starting article processing");
  modifyHtml(filteredZimList);
});

// 3ms per link
