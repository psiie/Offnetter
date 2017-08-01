const async = require("async");
const path = require("path");
const download = require("download");
const cheerio = require("cheerio");
const fs = require("fs");
const { loadListFile, cleanUrl, getFilename } = require("./_helper");
const {
  WIKI_LIST,
  CONCURRENT_CONNECTIONS,
  SAVE_PATH,
  WIKI_DL
} = require("./config");

function massDownloadImages(imageSources) {
  function processImage(url, callback) {
    const dlUrl = cleanUrl(url);
    const filename = getFilename(url);
    const saveLocation = path.join(SAVE_PATH, filename);
    fs.access(saveLocation, fs.constants.F_OK, doesntExist => {
      if (doesntExist) {
        console.log("downloading", filename);
        downloadImage(dlUrl, filename, saveLocation, callback);
      } else {
        console.log("skipping", filename);
        callback();
      }
    });
  }

  function downloadImage(url, filename, saveLocation, callback) {
    console.log("downloading", filename);
    download(url)
      .then(data => fs.writeFile(saveLocation, data, callback))
      .catch(err => {
        // Push image back on the queue if it is a 429 (too many requests)
        if (err.statusCode === 429) {
          console.log("pushing", filename, "back on the queue");
          queue.push(url);
        }
        console.log("   ", err.statusCode, filename);

        // Write error out to file
        const ERR_FILE = path.join(__dirname, "missing_images.txt");
        fs.appendFile(ERR_FILE, `${err.statusCode} ${url}\n`, err => {
          if (err) console.log("problems appending to error file", err);
          callback();
        });
      });
  }

  const queue = async.queue(processImage, CONCURRENT_CONNECTIONS);
  queue.push(Object.keys(imageSources));
  queue.drain = () => {
    console.log("All Images Downloaded");
  };
}

function gatherImageList(zimList) {
  function processHtmlFile(filename, callback) {
    console.log(
      `${logCounter}/${zimList.length} | processing html ${filename}`
    );
    /* Load HTML from file, use Cheerio (like jQuery) to find all
    image tags. Take the src and add it to the master list of imageSources */
    const htmlFilePath = path.join(WIKI_DL, filename + ".html");
    fs.readFile(htmlFilePath, "utf8", (err, html) => {
      logCounter++;
      if (err) {
        callback();
        return;
      }
      const $ = cheerio.load(html);
      const img = $("img");
      const svg = $("svg");
      img.each((idx, each) => imageSources[each.attribs.src] = 1);
      svg.each((idx, each) => imageSources[each.attribs.src] = 1);
      callback();
    });
  }

  const imageSources = {};
  let logCounter = 0;

  // Create image folder if not exist
  fs.access(SAVE_PATH, fs.constants.F_OK, doesntExist => {
    if (doesntExist) fs.mkdirSync(SAVE_PATH);
  });

  console.log("Starting to process html files (and looking for image links)");
  const fileQueue = async.queue(processHtmlFile, CONCURRENT_CONNECTIONS);
  fileQueue.push(zimList);
  fileQueue.drain = () => {
    console.log("All html files parsed for images");
    massDownloadImages(imageSources);
  };
}

// --------- Init --------- //
/* Load up all the html files, find the image links, add to list,
then download each image (only if not found locally */

console.log("Loading list");
loadListFile(WIKI_LIST).then(zimList => {
  console.log("List loaded. Starting to gather images");
  gatherImageList(zimList);
});
