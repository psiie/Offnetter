// NEed to compare output with iinput for which is smaller

const async = require('async');
const path = require('path');
const download = require('download');
const cheerio = require('cheerio');
const gm = require('gm');
const fs = require('fs');
const {
  SAVE_PATH,
  RELATIVE_SAVE_PATH,
  PROCESSED_WIKI_DL,
  CONCURRENT_CONNECTIONS,
  IMAGE_EXTENSIONS
} = require('./config');
const exportPath = path.join(PROCESSED_WIKI_DL, RELATIVE_SAVE_PATH);

function getImageFiles() {
  /* Load both current image directory and destination. Compare
  and remove images that have already been converted */
  const alreadyConvertedImages = fs.readdirSync(exportPath);
  let images = fs.readdirSync(SAVE_PATH);
  images = images.filter(file => alreadyConvertedImages.indexOf(file) === -1);
  images = images.filter(file => IMAGE_EXTENSIONS.indexOf(file.split('.').slice(-1)[0]) !== -1);
  convertListOfImages(images);
}

function convertListOfImages(imagesArr) {
  function convert(image, callback) {
    const imagePath = path.join(SAVE_PATH, image);
    const exportImagePath = path.join(exportPath, image);
    const ext = image.split('.').slice(-1)[0];

    // Convert image. If PNG, don't gaussian
    let convertion = gm(imagePath).noProfile().strip().interlace('Plane').colorspace('RGB').colors(64);
    if (ext !== 'png') convertion.gaussian(0.01);
    convertion.quality(50);

    convertion.write(exportImagePath, err => {
      if (err) console.log('Error writing', image);
      callback();
    });
  }

  const queue = async.queue(convert, CONCURRENT_CONNECTIONS);
  queue.push(imagesArr);
  queue.drain = () => {
    console.log('All image files converted');
  };
}

getImageFiles();
