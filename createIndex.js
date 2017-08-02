const async = require("async");
const path = require("path");
const download = require("download");
const cheerio = require("cheerio");
const fs = require("fs");
// const fse = require('fs-extra'); // going to use this to copy files
const { loadListFile } = require("./_helper");
const { WIKI_LIST, PROCESSED_WIKI_DL } = require("./config");

function generateIndex(indexList) {
  console.log("Starting to generate list");
  let logCounter = 0;

  const $ = cheerio.load("");
  $("body").append($("<ul>"));

  indexList.forEach(item => {
    console.log(`${logCounter}/${indexList.length} | Processing ${item}`);
    let $listItem = $("<li>");
    let $anchor = $("<a>");
    $anchor.text(item);
    $anchor.attr("href", `${item}.html`);
    $listItem.append($anchor);
    $("ul").append($listItem);
    logCounter++;
  });

  console.log("Writing index.html");
  const indexPagePath = path.join(PROCESSED_WIKI_DL, "index.html");
  fs.writeFile(indexPagePath, $.html(), "utf8", err => {
    if (err) console.log("error writing index.html page");
    console.log("Index page generated and saved");
  });
}

console.log("Loading list of processed files");
let processedFiles = fs.readdir(PROCESSED_WIKI_DL, (err, files) => {
  if (err) {
    console.log("Fatal error: Cannot read directory");
    return;
  }
  const fileList = files.map(file => file.split(".").slice(0, -1)[0]);
  generateIndex(fileList);
});
