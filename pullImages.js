const async = require("async");
const path = require("path");
const download = require("download");
const cheerio = require("cheerio");
const fs = require("fs");
const CONCURRENT_CONNECTIONS = 4;
const WIKI_DL = path.join(__dirname, "raw_wiki_articles");
const SAVE_PATH = path.join(WIKI_DL, "images");

function massDownloadImages(imageArr) {
  const cleanUrl = url => (url[0] === "/" ? url.slice(2) : url);
  const getFilename = url => url.split("/").slice(-1)[0].replace(/%/g, "");

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
  queue.push(imageArr);
  queue.drain = () => {
    console.log("All Images Downloaded");
  };
}

function gatherImageList() {
  function processHtmlFile(filename, callback) {
    /* Load HTML from file, use Cheerio (like jQuery) to find all
    image tags. Take the src and add it to the master list of imageSources */
    const htmlFilePath = path.join(WIKI_DL, filename + ".html");
    const html = fs.readFileSync(htmlFilePath, "utf8");
    const $ = cheerio.load(html);
    const img = $("img");
    const svg = $("svg");
    img.each((idx, each) => imageSources.push(each.attribs.src));
    svg.each((idx, each) => imageSources.push(each.attribs.src));
    callback();
  }

  const imageSources = [];

  // Get list of all html files
  let htmlFiles = fs.readdirSync(WIKI_DL);
  htmlFiles = htmlFiles.filter(
    files => files.split(".").slice(-1)[0] === "html"
  );
  htmlFiles = htmlFiles.map(files => files.split(".").slice(0, -1).join("."));

  // Create image folder if not exist
  fs.access(SAVE_PATH, fs.constants.F_OK, doesntExist => {
    if (doesntExist) fs.mkdirSync(SAVE_PATH);
  });

  const fileQueue = async.queue(processHtmlFile, CONCURRENT_CONNECTIONS);
  fileQueue.push(htmlFiles);
  fileQueue.drain = () => {
    console.log("All html files parsed for images");
    massDownloadImages(imageSources);
  };
}

// --------- Init --------- //
/* Load up all the html files, find the image links, add to list,
then download each image (only if not found locally */
gatherImageList();
