const async = require("async");
const path = require("path");
const download = require("download");
const cheerio = require("cheerio");
const fs = require("fs");
const WIKI_DL = path.join(__dirname, "raw_wiki_articles");
const PROCESSED_WIKI_DL = path.join(__dirname, "processed_wiki_articles");
const SAVE_PATH = path.join(WIKI_DL, "images");
const RELATIVE_SAVE_PATH = "images/";

const getFilename = url => url.split("/").slice(-1)[0].replace(/%/g, "");

// const html = fs.readFileSync(
//   path.join(__dirname, "raw_wiki_articles", "Lubin.html"),
//   "utf8"
// );

// const $ = cheerio.load(html);
// $("script").remove();
// $("noscript").remove();
// $("link").remove();
// $("head").append('<link rel="stylesheet" href="index.css">');
// $("img").each(function() {
//   const oldSrc = $(this).attr("src");
//   const imageFilename = getFilename(oldSrc);
//   const newSrc = path.join(RELATIVE_SAVE_PATH, imageFilename);
//   $(this).attr("src", newSrc);
// });

// const processedHtmlPath = path.join(PROCESSED_WIKI_DL, "Lubin.html");
// fs.writeFile(processedHtmlPath, $.html(), "utf8", err => {
//   if (err) console.log("error writing file", err);
//   console.log("done");
// });
