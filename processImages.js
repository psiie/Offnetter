// NEed to compare output with iinput for which is smaller

const async = require("async");
const path = require("path");
const download = require("download");
const cheerio = require("cheerio");
const gm = require("gm");
const fs = require("graceful-fs");
const fse = require("fs-extra");
const {
  SAVE_PATH,
  RELATIVE_SAVE_PATH,
  PROCESSED_WIKI_DL,
  CONCURRENT_CONNECTIONS,
  IMAGE_EXTENSIONS
} = require("./config");
const exportPath = path.join(PROCESSED_WIKI_DL, RELATIVE_SAVE_PATH);

// TODO: copyUnconvertables needs a timer

// ---------- Phase 4 ---------- //
function convertListOfImages(imagesArr) {
  const startTime = Date.now() / 1000;
  function convert(image, callback) {
    const timeDiff = Date.now() / 1000 - startTime;
    const timePer = timeDiff / logCounter;
    const timeRemaining = (imagesArr.length - logCounter) * timePer;
    const hoursRemaining = parseInt(timeRemaining / 60 / 60);
    const minutesRemaining = parseInt(timeRemaining / 60 % 60);

    const truncFilename = image.length > 54 ? image.slice(0, 50) + "..." + image.split(".").slice(-1) : image;
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`  ┗ ${hoursRemaining}:${minutesRemaining} | ${logCounter}/${imagesArr.length} | ${truncFilename}`);
    logCounter++;

    const imagePath = path.join(SAVE_PATH, image);
    const exportImagePath = path.join(exportPath, decodeURIComponent(image));
    const ext = image.split(".").slice(-1)[0];

    // convert to function, and perform if on if image or video
    let convertion = gm(imagePath) //
      .noProfile() //
      .strip() //
      .interlace("Plane") //
      .colorspace("RGB"); //
    // .colors(64); // Can corrupt some images
    convertion.quality(50);

    convertion.write(exportImagePath, err => {
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      if (err) console.log("Error writing", image, err);
      callback();
    });
  }

  let logCounter = 0;
  const queue = async.queue(convert, CONCURRENT_CONNECTIONS);
  queue.push(imagesArr);
  queue.drain = () => console.log("\nAll image files converted");
}

// ---------- Phase 3 ---------- //
function copyUnconvertables(fileArr, imagesArr) {
  function copy(file, callback) {
    const isSVG = file.length > 32 && file.split(".").length === 1;
    const input = path.join(SAVE_PATH, file);
    let output = path.join(exportPath, decodeURIComponent(file));
    if (isSVG) output += ".svg";
    fse.copy(input, output, err => {
      if (err) console.log("Error copying", file);
      callback();
    });
  }
  let logCounter = 0;
  const queue = async.queue(copy, 1);
  queue.push(Object.keys(fileArr));
  queue.drain = () => {
    console.log("All unconvertable files copied (eg: SVGs)");
    convertListOfImages(imagesArr);
  };
}

// ---------- Phase 2 ---------- //
function getImageFiles() {
  /* Load both current image directory and destination. Compare
  and remove images that have already been converted */
  const unConvertables = {};
  const alreadyConvertedImg = {};
  fs.readdirSync(exportPath).forEach(file => alreadyConvertedImg[file] = 1);

  let images = fs.readdirSync(SAVE_PATH);
  images = images.filter(file => !alreadyConvertedImg[file]);
  images = images.filter(file => {
    const convertable = IMAGE_EXTENSIONS[file.split(".").slice(-1)[0]];
    if (!convertable) unConvertables[file] = 1; // mostly SVGs
    return convertable;
  });

  console.log(`Starting convertion of ${images.length} images`);
  copyUnconvertables(unConvertables, images); // images is passed through
}

// ---------- Phase 1 ---------- //
console.log("Starting. Loading list of images already converted");
getImageFiles();
