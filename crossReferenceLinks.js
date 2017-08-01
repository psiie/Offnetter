const async = require("async");
const path = require("path");
const download = require("download");
const cheerio = require("cheerio");
const fs = require("fs");
const Database = require("nedb");
const { loadListFile, getFilename, cleanListOfLinks } = require("./_helper");
const {
  WIKI_LIST,
  RELATIVE_SAVE_PATH,
  PROCESSED_WIKI_DL,
  CONCURRENT_CONNECTIONS,
  IMAGE_EXTENSIONS,
  WIKI_DL,
  DATABASE_LINKS
} = require("./config");
let db = new Database({ filename: DATABASE_LINKS, autoload: true });

function getCrossReferenceList(zimList) {
  const masterCrossReferenceList = [];
  let logCounter = 0;

  function examineHtmlFile(file, callback) {
    const filePath = path.join(WIKI_DL, file + ".html");
    fs.readFile(filePath, "utf8", (err, html) => {
      if (err) {
        console.log("Missing html file that is in the list. Skipping", file);
        callback();
        return;
      }

      console.log(
        `${logCounter}/${zimList.length} | ${masterCrossReferenceList.length} |`,
        "Building link list... examining",
        filePath.split("/").slice(-1)[0]
      );

      // Get all links and shove it into a list
      let linkList = [];
      const $ = cheerio.load(html);
      const references = $("a");
      references.each((idx, each) => linkList.push(each.attribs.href));
      linkList = cleanListOfLinks(linkList);
      linkList = linkList.map(url => {
        return { url };
      });

      /* shove that list into a database. This is a append-only database
      which cleans itself only after we are done :) */
      db.insert(linkList, err => {
        if (err) console.log("couldnt add bulk links from article", file);
        logCounter++;
        callback();
      });
    });
  }

  // --- Queue Initialize --- //
  const fileQueue = async.queue(examineHtmlFile, CONCURRENT_CONNECTIONS);
  fileQueue.push(zimList);
  fileQueue.drain = () => {
    console.log(
      "All html files read, and a database of cross-referenced links were created"
    );
  };
}

// --- Init --- //
loadListFile(WIKI_LIST).then(zimList => {
  console.log("Wiki List Loaded. Starting Cross Referencing");
  getCrossReferenceList(zimList);
});
