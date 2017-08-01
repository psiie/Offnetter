const async = require("async");
const path = require("path");
// const download = require("download");
// const cheerio = require("cheerio");
const fs = require("fs");
// const Database = require("nedb");
const {
  // loadListFile,
  // getFilename,
  // cleanListOfLinks
} = require("./_helper");
const {
  // WIKI_LIST,
  // RELATIVE_SAVE_PATH,
  // PROCESSED_WIKI_DL,
  // CONCURRENT_CONNECTIONS,
  // IMAGE_EXTENSIONS,
  // WIKI_DL,
  // DATABASE_LINKS
} = require("./config");

function modifyHtml(htmlFiles, crossReferenceList) {
  function saveFile(filename, html, callback) {
    console.log("saving file");
    const filePath = path.join(PROCESSED_WIKI_DL, filename + ".html");
    fs.writeFile(filePath, html, "utf8", err => {
      if (err) console.log("err writing html file");
      console.log("done writing new html file");
      callback();
    });
  }

  function cleanSingleFile(file, callback) {
    console.log("Cleaning file: ", file);
    const filePath = path.join(WIKI_DL, file + ".html");
    let html = fs.readFileSync(filePath, "utf8");
    const $ = cheerio.load(html);
    let links = [];

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
    $("a").each(function() {
      let oldSrc = $(this).attr("href");
      let ext = oldSrc && oldSrc.split(".").slice(-1)[0];
      oldSrc = cleanListOfLinks([oldSrc])[0];
      oldSrc = oldSrc && oldSrc.replace("//", "");
      // If link is in the zim, update the relative path. If not, remove the <a> tag
      if (
        IMAGE_EXTENSIONS.indexOf(ext) === -1 &&
        crossReferenceList.indexOf(oldSrc) === -1
      ) {
        const innerText = $(this).text();
        $(this).replaceWith(innerText);
      } else {
        const newSrc = oldSrc ? oldSrc + ".html" : "#";
        $(this).attr("href", newSrc);
      }
    });

    saveFile(file, $.html(), callback);
  }

  const queue = async.queue(cleanSingleFile, CONCURRENT_CONNECTIONS);
  queue.push(htmlFiles);
  queue.drain = () => {
    console.log("All html files modified");
  };
}

modifyHtml(htmlFiles, masterCrossReferenceList);
