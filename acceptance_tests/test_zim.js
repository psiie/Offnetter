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

if (process.argv[2] === undefined) {
  console.log('You must specify a article list as a parameter. ex: ./test_zim top-10-articles.txt');
  process.exit();
}

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
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(`  ┗ ${queue.length()} pages remaining. Testing ${page.slice(0,20)}`);
  request(url, (err, data) => {
    if (err || (data && !data.body)) {
      console.log('err:', err);
      callback();
      return;
    }

    // Find all images on page and check if they are in the zim
    // will need to rewrite so that these nested requests get added to a queue
    const $ = cheerio.load(data.body);
    $('[src]').each((idx, item) => {
      if (!item || (item && item.attribs && !item.attribs.src)) return;
      let filePath = item.attribs.src;
      const ext = filePath && filePath.split('.').reverse()[0];
      if (ignoreExt.indexOf(ext.toLowerCase()) !== -1) return;
      filePath = filePath.replace("../", "/"); // remove leading ..
      filePath = kiwixServer + filePath;
      request(filePath, (err, data) => {
        if (err) console.log('1 err', err);
        else if (data && data.statusCode >= 400) {
          status404++;
          images404.push(filePath);
          console.log('no image found', filePath);
        } else if (data && data.statusCode < 400) {
          status200++;
          images200.push(filePath);
        }
      });

    });
    
    callback();
  });
}

function isImageFoundLocally(imgList) {
  console.log('looking up', imgList.length, 'links');
  const dir = path.join(__dirname, '../', 'processed_wiki_articles/', 'images/')
  imgList.forEach(file => {
    console.log(path.join(dir, file.split('/').reverse()[0]));
  });
  // const existingImgs = imgList.filter(file => fs.existsSync(path.join(dir, file.split('/').reverse()[0])));
  // console.log(`${existingImgs.length} Missing images found on HDD but not in zim`);
  // fs.writeFileSync(path.join(__dirname, 'results/404_FoundOnHDD.txt'), existingImgs, 'utf8');
}

const queue = async.queue(testPage, 1);
queue.drain = () => {
  console.log("\nAll html files parsed for images");
  console.log(`${status200} Found images in zim`);
  console.log(`${status404} Missing images in zim`);
  fs.writeFileSync(path.join(__dirname, 'results/200.txt'), images200, 'utf8');
  fs.writeFileSync(path.join(__dirname, 'results/404.txt'), images404, 'utf8');
  isImageFoundLocally(images404);
};

findZimOnIndexPage().then(shortPath => {
  zimPath = kiwixServer + shortPath;
  loadListFile(process.argv[2]).then(list => {
    queue.push(list);
  });
});