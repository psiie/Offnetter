const async = require("async");
const path = require("path");
const download = require("download");
const cheerio = require("cheerio");
const fs = require("fs");
const { loadListFile, getFilename } = require("./_helper");
const {
  WIKI_LIST,
  RELATIVE_SAVE_PATH,
  PROCESSED_WIKI_DL,
  CONCURRENT_CONNECTIONS,
  IMAGE_EXTENSIONS,
  WIKI_DL
} = require("./config");

const cleanListOfLinks = linkArr => {
  let linkList = linkArr;
  linkList = linkList.filter(url => {
    if (!url) return false;
    else if (url[0] === "#") return false;
    else if (/https?:\/\/.+wiki/g.test(url)) return true;
    else if (/https?:\/\//g.test(url)) return false;
    else if (/index.php/g.test(url)) return false;
    else if (/action=edit/g.test(url)) return false;
    return true;
    // else if (/File:/g.test(url)) return false; // Removes potential pictures see: https://en.wikipedia.org/wiki/ASCII
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

function getCrossReferenceList(zimList) {
  function examineHtmlFile(file, callback) {
    /* Load in HTML file, look at the links, filter out the obviously 
    bad links and add all of these to the master list */
    const filePath = path.join(WIKI_DL, file + ".html");
    const html = fs.readFileSync(filePath, "utf8");
    const $ = cheerio.load(html);
    console.log("examining", filePath.split("/").slice(-1)[0]);
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
  htmlFiles = htmlFiles.map(file => file.split(".").slice(0, -1).join("."));
  htmlFiles = htmlFiles.filter(file => zimList.indexOf(file) !== -1);

  const fileQueue = async.queue(examineHtmlFile, CONCURRENT_CONNECTIONS);
  fileQueue.push(htmlFiles);
  fileQueue.drain = () => {
    console.log("All html files read");
    modifyHtml(htmlFiles, masterCrossReferenceList);
  };
}

loadListFile(WIKI_LIST).then(zimList => {
  getCrossReferenceList(zimList);
});
