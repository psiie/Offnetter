const async = require("async");
const fs = require('fs-extra');
const path = require('path');
const request = require('request');
const cheerio = require('cheerio');
const { loadListFile } = require("../_helper");

const ignoreExt = ['js', 'html', 'css'];
const kiwixServer = 'http://localhost:8009';
let zimPath;
let status200 = 0;
let status404 = 0;
const images200 = [];
const images404 = [];
const imagesToCheck = {};

if (process.argv[2] === undefined) {
  console.log('You must specify a article list as a parameter. ex: ./test_zim top-10-articles.txt');
  process.exit();
}

// -------- Functions -------- //

function findZimOnIndexPage() {
  return new Promise((resolve, reject) => {
    request(kiwixServer, (err, data) => {
      if (err || (data && !data.body)) {
        console.log('err:', err);
        reject();
        return;
      }

      const $ = cheerio.load(data.body);
      const uriPath = $('.kiwix a')[0].attribs.href;
      resolve(uriPath);
    });
  });
}

function testPage(page, callback) {
  const url = `${zimPath}A/${page}.html`;
  
  logCounter++;
  const timeDiff = Date.now() / 1000 - startTime;
  const timePer = timeDiff / logCounter;
  const timeRemaining = (totalCount - logCounter) * timePer;
  const hoursRemaining = parseInt(timeRemaining / 60 / 60);
  const minutesRemaining = parseInt(timeRemaining / 60 % 60);
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(`  ┗ ${hoursRemaining}:${minutesRemaining} | ${queue.length()} pages left | Testing ${page.slice(-20)}`);

  request(encodeURI(url), (err, data) => {
    if (err || (data && !data.body)) { console.log('err:', err); callback(); return; }
    // Find all images on page and check if they are in the zim
    // will need to rewrite so that these nested requests get added to a queue
    const processLink = link => {
      // Get path
      let filePath = link;
      const ext = filePath && filePath.split('.').reverse()[0];
      if (ignoreExt.indexOf(ext.toLowerCase()) !== -1) return;
      // Path cleanup
      filePath = filePath.replace("../", ""); // remove leading ..
      filePath = zimPath + filePath;
      // Add to queue
      imagesToCheck[filePath] = 1;
    };

    // const linksInPage = Array.prototype.concat(
      //   data.body.match(/svg.+src="(.+?)"/g) || [], 
      //   data.body.match(/img.+src="(.+?)"/g) || []
      // );
      
    const linksInPage = data.body.match(/(?=(?:svg)|(?:img)).+src="(.+?)"/g) || [];
    linksInPage.forEach(link => {
      const cleaned = link.match(/"(.+)"/);
      const newLink = cleaned && cleaned.length > 1 && cleaned[1];
      if (!cleaned) return;
      processLink(newLink);
    });
    
    callback();
  });
}

function isImageFoundLocally(imgList) {
  console.log(`Checking ${imgList.length} files on the HDD [see if they exist]\n`);
  const dir = path.join(__dirname, '../', 'processed_wiki_articles/', 'images/');
  let counter = 0;
  const existingImgs = imgList.filter(file => {
    counter++;
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`  ┗ ${counter}/${imgList.length} | Checking ${file.slice(-20)}`);
    
    return fs.existsSync(path.join(dir, file.split('/').reverse()[0]));
  });
  
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(`${existingImgs.length} Missing images found on HDD but not in zim\n`);
  fs.writeFileSync(path.join(__dirname, 'results/404_FoundOnHDD.txt'), existingImgs, 'utf8');
}

function checkImageSource(filePath, cb) {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(`  ┗ ${imgQueue.length()} imgs left. | Testing ${filePath.slice(-20)}`)
  request(encodeURI(filePath), (err, data) => {
    if (err) { cb(); return; }
    else if (data && data.statusCode >= 400) {
      status404++;
      images404.push(filePath);
    } else if (data && data.statusCode < 400) {
      status200++;
      images200.push(filePath);
    }
    cb();
  });
}

// -------- Define asyncs -------- //
const startTime = Date.now() / 1000;
let totalCount = 0;
let logCounter = 0;
const imgQueue = async.queue(checkImageSource, 8);
const queue = async.queue(testPage, 1);
queue.drain = () => {
  console.log('now checking images to see if they exist in the zim');
  imgQueue.push(Object.keys(imagesToCheck));
}
imgQueue.drain = () => {
  console.log('\ndone checking image queue');
  console.log("\nAll html files parsed for images");
  console.log(`${status200} Found images in zim`);
  console.log(`${status404} Missing images in zim`);
  fs.writeFileSync(path.join(__dirname, 'results/200.txt'), images200.map(a => '\n' + a), 'utf8');
  fs.writeFileSync(path.join(__dirname, 'results/404.txt'), images404.map(a => '\n' + a), 'utf8');

  // Check local hdd for images
  isImageFoundLocally(images404);
};

// -------- init -------- //
findZimOnIndexPage().then(shortPath => {
  zimPath = kiwixServer + shortPath;
  // Start checkImageSources with the .txt file as the list
  loadListFile(process.argv[2]).then(list => {
    totalCount = list.length;
    queue.push(list)
  });
});