const async = require("async");
const path = require("path");
const download = require("download");
const fs = require("graceful-fs");
const { loadListFile, cleanUrl, getFilename, prependUrl } = require("./_helper");
const { WIKI_LIST, CONCURRENT_CONNECTIONS, SAVE_PATH, WIKI_DL, LOG_MISSING } = require("./config");

// --------- Phase 3 --------- //
function massDownloadImages(imageSources) {
  const startTime = Date.now() / 1000;
  const totalCount = Object.keys(imageSources).length;

  function processImage(url, callback) {
    logCounter++;
    let dlUrl = cleanUrl(url);
    dlUrl = prependUrl(dlUrl);

    let filename = getFilename(url);
    filename = filename.split("?")[0]; // get rid of query parameters on the filename
    try {
      filename = decodeURI(filename);
    } catch (e) {
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write("Malformed URL. Skipping image");
      callback();
      return;
    }

    const saveLocation = path.join(SAVE_PATH, filename);
    fs.access(saveLocation, fs.constants.F_OK, doesntExist => {
      if (doesntExist) {
        downloadImage(dlUrl, filename, saveLocation, callback);
      } else {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(`  ┗ skipping ${filename.slice(0,20)}`);
        callback();
      }
    });
  }

  function downloadImage(url, filename, saveLocation, callback) {
    const timeDiff = Date.now() / 1000 - startTime;
    const timePer = timeDiff / logCounter;
    const timeRemaining = (totalCount - logCounter) * timePer;
    const hoursRemaining = parseInt(timeRemaining / 60 / 60);
    const minutesRemaining = parseInt(timeRemaining / 60 % 60);
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`  ┗ ${hoursRemaining}:${minutesRemaining} | ${logCounter}/${imageList.length} | downloading ${filename.slice(0, 40)}`);
    
    download(url).then(data => fs.writeFile(saveLocation, data, callback)).catch(err => {
      // Push image back on the queue if it is a 429 (too many requests)
      if (err.statusCode === 429) {
        console.log("\n429. pushing", filename, "back on the queue. Delaying myself.");
        queue.push(url);
      } else if (LOG_MISSING) {
        // Write error out to file
        const ERR_FILE = path.join(__dirname, "missing_images.txt");
        fs.appendFile(ERR_FILE, `${err.statusCode} ${url}\n`, err => {
          if (err) console.log("problems appending to error file", err);
          callback();
        });
      }
    });
  }

  let logCounter = 0;
  const imageList = Object.keys(imageSources);
  const queue = async.queue(processImage, CONCURRENT_CONNECTIONS);
  queue.push(imageList);
  queue.drain = () => {
    console.log("\nAll Images Downloaded");
  };
}

// --------- Phase 2 --------- //
function gatherImageList(zimList) {
  let logCounter = 0;
  const startTime = Date.now() / 1000;

  const imageSources = {};
  const totalCount = zimList.length;

  function processHtmlFile(filename, callback) {
    const timeDiff = Date.now() / 1000 - startTime;
    const timePer = timeDiff / logCounter;
    const timeRemaining = (totalCount - logCounter) * timePer;
    const hoursRemaining = parseInt(timeRemaining / 60 / 60);
    const minutesRemaining = parseInt(timeRemaining / 60 % 60);
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`  ┗ ${hoursRemaining}:${minutesRemaining} | ${logCounter}/${zimList.length} | processing html ${filename.slice(0, 40)}`);
    /* Load HTML from file, use Cheerio (like jQuery) to find all
    image tags. Take the src and add it to the master list of imageSources */
    const htmlFilePath = path.join(WIKI_DL, filename + ".html");
    fs.readFile(htmlFilePath, "utf8", (err, html) => {
      logCounter++;
      if (err) { callback(); return; }
      /* I am not replacing anything (the replace function doesn't mutate but 
      returns a new object). I am using this because the replace method allows
      for the g flag. exec does not. Kind of a hack in the name of science! */
      html.replace(/img.+?src="(.+?)"/g, (m, a) => imageSources[a] = 1);
      callback();
    });
  }

  const fileQueue = async.queue(processHtmlFile, CONCURRENT_CONNECTIONS);
  fileQueue.push(zimList);
  fileQueue.drain = () => {
    console.log("\nAll html files parsed for images");
    massDownloadImages(imageSources);
  };
}

// --------- Phase 1 --------- //
/* Load up all the html files, find the image links, add to list,
then download each image (only if not found locally */

// Create image folder if not exist
fs.access(SAVE_PATH, fs.constants.F_OK, doesntExist => { if (doesntExist) fs.mkdirSync(SAVE_PATH); });
// Load the wiki_list.lst file first
loadListFile(WIKI_LIST).then(zimList => {
  console.log("List loaded. Starting to open html and seek image links");
  gatherImageList(zimList);
});
