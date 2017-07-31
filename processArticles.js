const async = require("async");
const path = require("path");
const download = require("download");
const cheerio = require("cheerio");
const fs = require("fs");
const WIKI_DL = path.join(__dirname, "raw_wiki_articles");
// const SAVE_PATH = path.join(WIKI_DL, "images");
// const RELATIVE_SAVE_PATH = "images/";
const PROCESSED_WIKI_DL = path.join(__dirname, "processed_wiki_articles");
const CONCURRENT_CONNECTIONS = 4;
const getFilename = url => url.split("/").slice(-1)[0].replace(/%/g, "");
const cleanListOfLinks = linkArr => {
  let linkList = linkArr;
  linkList = linkList.filter(url => {
    if (!url) return false;
    else if (url[0] === "#") return false;
    else if (/https?:\/\/.+wiki/g.test(url)) return true;
    else if (/https?:\/\//g.test(url)) return false;
    else if (/File:/g.test(url)) return false;
    else if (/index.php/g.test(url)) return false;
    else if (/action=edit/g.test(url)) return false;
    return true;
  });
  linkList = linkList.map(url => decodeURI(url));
  linkList = linkList.map(url => url.replace("/wiki/", ""));
  linkList = linkList.map(url => url.split("?")[0]); // get rid of parameters eg: ?action=submit
  return linkList;
};

function modifyHtml(htmlFiles, crossReferenceList) {
  function saveFile(filename, html, callback) {
    const filePath = path.join(PROCESSED_WIKI_DL, filename + ".html");
    fs.writeFile(filePath, html, "utf8", err => {
      if (err) console.log("err writing html file");
      console.log("done writing new html file");
      callback();
    });
  }

  function cleanSingleFile(file, callback) {
    const filePath = path.join(WIKI_DL, file + ".html");
    let html = fs.readFileSync(filePath, "utf8");
    const $ = cheerio.load(html);
    let links = [];
    // $("a").each((idx, each) => links.push(each.attribs.href));
    // links = cleanListOfLinks(links); // a list of all links on the page

    $("a").each(function() {
      let oldSrc = $(this).attr("href");
      oldSrc = cleanListOfLinks([oldSrc])[0];
      oldSrc = oldSrc && oldSrc.replace("//", "");
      if (crossReferenceList.indexOf(oldSrc) === -1) {
        const innerText = $(this).text();
        $(this).replaceWith(innerText);
        // $(this).attr("href", "#"); // Link not going to be in the zim. So lets remove it.
      } else {
        $(this).attr("href", oldSrc + ".html"); // link is in the zim, but we need to change it to be relative
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

function getCrossReferenceList() {
  function examineHtmlFile(file, callback) {
    /* Load in HTML file, look at the links, filter out the obviously 
    bad links and add all of these to the master list */
    const filePath = path.join(WIKI_DL, file + ".html");
    const html = fs.readFileSync(filePath, "utf8");
    const $ = cheerio.load(html);
    let linkList = [];
    const references = $("a");
    references.each((idx, each) => linkList.push(each.attribs.href));
    linkList = cleanListOfLinks(linkList);
    linkList.forEach(url => {
      if (
        // Sometimes I hate auto-formatters...
        masterCrossReferenceList.indexOf(url) === -1 &&
        htmlFiles.indexOf(url) !== -1
      ) {
        masterCrossReferenceList.push(url);
      }
    });
    callback();
  }

  const masterCrossReferenceList = [];

  let htmlFiles = fs.readdirSync(WIKI_DL);
  htmlFiles = htmlFiles.filter(
    files => files.split(".").slice(-1)[0] === "html"
  );
  htmlFiles = htmlFiles.map(files => files.split(".").slice(0, -1).join("."));

  const fileQueue = async.queue(examineHtmlFile, CONCURRENT_CONNECTIONS);
  fileQueue.push(htmlFiles);
  fileQueue.drain = () => {
    console.log("All html files read");
    modifyHtml(htmlFiles, masterCrossReferenceList);
  };
}

getCrossReferenceList();

// image replacement notes below:

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
